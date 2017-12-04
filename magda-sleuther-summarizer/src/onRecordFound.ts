import * as _ from "lodash";

import Registry from "@magda/typescript-common/dist/registry/AuthorizedRegistryClient";
import { Record } from "@magda/typescript-common/dist/generated/registry/api";
import summarizeAspectDef, {
    SummarizeAspect,
    RetrieveResult
} from "./summarizeAspectDef";
import VALID_FORMATS from "./validFormats"
//created a separate summary API.js file because make a .d.ts will be much easier with 1 file instead of a whole node-summary repo.
import {getSummaryFromURL} from "./summaryAPI"
import unionToThrowable from "@magda/typescript-common/src/util/unionToThrowable";
/*declare function getSummaryFromContent(title: string, content: string): {
    err: any,
    summary: string
}*/

export default async function onRecordFound(
    record: Record,
    registry: Registry,
) {
    const distributions: Record[] =
        record.aspects["dataset-distributions"] &&
        record.aspects["dataset-distributions"].distributions;

    if (!distributions || distributions.length === 0) {
        return Promise.resolve();
    }

    // Check each link that we are planning to summarize, validate them
    const linkChecks: DistributionSummary[] = _.flatMap(
        distributions,
        (distribution: Record) =>
            checkDistributionFormat(
                distribution,
                distribution.aspects["dcat-distribution-strings"]
            )
    );

    // gathering all the sleuthering results so that we can put them all into the database at once
    let recordSummaries: SummarizeSleuthingResult[];
    linkChecks.map(linkCheck => {
        linkCheck.op().then(result => {
            recordSummaries.push(result);
        }).catch(err => {
            console.log("an error occured in the op method inside checkDistributionFormat: " + err);
        });
    });

    // put sleuthering results into the database, and store their promises so we can return them in this function
    const recordSummaryPromise: Promise<Record[]> = Promise.all(recordSummaries.map(recordSummary => {
        return recordSummaryAspect(registry, recordSummary);
    }));

    await Promise.all([recordSummaryPromise]); //Promise.all([summarizeAspectPromise]);
}

function recordSummaryAspect(registry: Registry, result: SummarizeSleuthingResult): Promise<Record> {
    return registry.putRecordAspect(result.distribution.id, summarizeAspectDef.id, result.aspect).then(unionToThrowable);
}

type DistributionSummary = {
    op: () => Promise<SummarizeSleuthingResult>
}

/**
 * checks to make sure all files are a format that can be summarized
 * @param distribution The distribution Record
 * @param distStringsAspect The dcat-distributions-strings aspect for this distribution
 */

function checkDistributionFormat(
    distribution: Record,
    distStringsAspect: any
): DistributionSummary[] {
    type DistURL = {
        url?: string;
        type: "downloadURL" | "accessURL";
    };

    const urls: DistURL[] = [
        {
            url: distStringsAspect.downloadURL as string,
            type: "downloadURL" as "downloadURL"
        },
        {
            url: distStringsAspect.accessURL as string,
            type: "accessURL" as "accessURL"
        }
    ].filter(x => !!x.url);

    // returning: A promise. Fulfilled state: returns a summary, reject state: returns the reason why a summary wont work.
    // summary = "" if a promise is of a rejected format. 
    return urls.map(url => {
        return  {
            op: () =>
                retrieveSummary(url.url)
                    .then(aspect => ({
                        distribution,
                        aspect,
                        urlType: url.type
                        
                    }))
                    .catch(err => ({
                        distribution,
                        aspect: {
                            status: "isNotValid" as RetrieveResult,
                            errorDetails: err
                        },
                        urlType: url.type
                    })) as Promise<SummarizeSleuthingResult>
                }
    });
}

interface SummarizeSleuthingResult {
    distribution: Record;
    aspect?: Summarizespect;
    urlType: "downloadURL" | "accessURL";
}

function retrieveSummary(url: string): Promise<SummarizeAspect> {
    const promise = new Promise<SummarizeAspect>((resolve, reject) => {
        if(containsValidExtensions(url)) {
            let info = getSummaryFromURL(url);
            if(info.err) {
                reject(info.err);
            } else {
                resolve({
                    status: "isValid",
                    summary: info.summary
                })
            }
        } else {
            reject(new Error("the file type of " + url + " isn't one of:" + VALID_FORMATS.join()))
        }
    });

    return promise;
}

// helper functions
// .*\.(txt|pdf)
function getRegexFromFormats(formats: string[]): string {
    let regexArr = formats.map(str => {
        str = str.substr(1, str.length - 1) + "|";
    });

    return ".*\.(" + regexArr.join('') + ")";

}

//plural version of successive function
/*function containsValidExtensions(array: string[]): boolean[] {
    function checkValidity(string: string): boolean {
        return string.match(getRegexFromFormats(VALID_FORMATS)) != null;
    }

    return array.map(checkValidity)
}*/

function containsValidExtensions(str: string): boolean {
    return str.match(getRegexFromFormats(VALID_FORMATS)) != null;
}


