import jsc from "@magda/typescript-common/dist/test/jsverify";
import {
    fuzzStringArbResult,
    arbFlatMap,
    distStringsArb,
    recordArbWithDists,
    stringArb
} from "@magda/typescript-common/dist/test/arbitraries";
import openLicenses from "../openLicenses";
import openFormats from "../openFormats";
import { ZERO_STAR_LICENSES } from "./examples";
import { Record } from "@magda/typescript-common/dist/generated/registry/api";
import * as _ from "lodash";

/** Generates strings with the words of open licenses embedded in them */
export const openLicenseArb = fuzzStringArbResult(jsc.elements(openLicenses));

const allFormatWords = new RegExp(
    _(openFormats)
        .values()
        .flatten()
        .flatMap((format: string) => format.split(" "))
        .join("|"),
    "i"
);

const fuzzArb = jsc.suchthat(stringArb, (string: string) => {
    return !allFormatWords.test(string);
});

/**
 * Generates a format string that will match the desired star count.
 */
export const formatArb = (starCount: number): jsc.Arbitrary<string> => {
    if (starCount === 0) {
        return jsc.oneof([2, 3, 4].map(x => formatArb(x)));
    } else if (starCount === 1) {
        return jsc.elements(ZERO_STAR_LICENSES);
    } else {
        return fuzzStringArbResult(
            jsc.elements(openFormats[starCount]),
            fuzzArb
        );
    }
};

/**
 * Generates a record with at least one distribution that will qualify
 * for the desired number of stars.
 */
export function recordForHighestStarCountArb(
    highestStarCount: number
): jsc.Arbitrary<Record> {
    const getForStarCount = (forStars: number) => {
        const license =
            forStars === 0 ? jsc.elements(ZERO_STAR_LICENSES) : openLicenseArb;

        return jsc.record({
            starCount: jsc.constant(forStars),
            dist: distStringsArb({
                license: license,
                format: formatArb(forStars)
            })
        });
    };

    const starRatingArb = jsc.suchthat(
        jsc.nearray(jsc.integer(0, highestStarCount)),
        starRatings =>
            starRatings.some(starRating => starRating === highestStarCount)
    );

    return arbFlatMap(
        starRatingArb,
        stars => jsc.tuple(stars.map(getForStarCount)),
        result => result.map(inner => inner.starCount)
    ).flatMap(
        (x: { dist: object }[]) => {
            const dists = x.map(({ dist }) => dist);
            return recordArbWithDists(dists);
        },
        record =>
            record.aspects["dataset-distributions"].distributions.map(
                (dist: Record) => dist.aspects["dcat-distribution-strings"]
            )
    );
}
