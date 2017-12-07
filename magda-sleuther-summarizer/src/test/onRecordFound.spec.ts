import {} from "mocha";
//import * as mocha from "mocha";
import { 
    expect,
    //should 
} from "chai";
//import * as cap from "chai-as-promised"
import * as sinon from "sinon";
import * as nock from "nock";
import jsc from "@magda/typescript-common/dist/test/jsverify";
/*import * as _ from "lodash";
import * as Client from "ftp";
import * as URI from "urijs";

import { Record } from "@magda/typescript-common/dist/generated/registry/api";
import { encodeURIComponentWithApost } from "@magda/typescript-common/dist/test/util";
import {
    specificRecordArb,
    distUrlArb,
    arrayOfSizeArb,
    arbFlatMap,
    recordArbWithDistArbs
} from "@magda/typescript-common/dist/test/arbitraries";
*/
import /*onRecordFound,*/ { 
    getRegexFromFormats,
    retrieveSummary,

} from "../onRecordFound";
/*import { SummarizeAspect } from "../summarizeAspectDef";
import urlsFromDataSet from "./urlsFromDataSet";*/
import {
    //alphanumericSymbolsArb,
    getRandomString, alphanumericSymbolsArb
} from "./arbitraries";
//import FtpHandler from "../FtpHandler";
//import AuthorizedRegistryClient from "@magda/typescript-common/dist/registry/AuthorizedRegistryClient";*/

describe("onRecordFound", function(this: Mocha.ISuiteCallbackContext) {
    before(() => {
        //chai.use(cap);
        sinon.stub(console, "info");
        nock.disableNetConnect();

        nock.emitter.on("no match", onMatchFail);
    });

    const onMatchFail = (req: any) => {
        console.error("Match failure: " + JSON.stringify(req.path));
    };

    after(() => {
        (console.info as any).restore();

        nock.emitter.removeListener("no match", onMatchFail);
    });

    /*const beforeEachProperty = () => {
        //registryScope = nock(registryUrl); //.log(console.log);
        //clients = {};
        //ftpSuccesses = {};
    };

    const afterEachProperty = () => {
        //nock.cleanAll();
    };*/

    
});

describe("#getRegexFromFormats", function() {
    jsc.property('should contain: .*\.()', jsc.array(alphanumericSymbolsArb(20, '')), (array: Array<string>) => {
        let str = getRegexFromFormats(array);
        console.log('the regex generated: ' + str);
        
        return str.includes('.*\.(') && str.includes(')');
    }); 

    /*it('should contain: .*\.() in this order', function() {

        return jsc.assertForall(jsc.fn(jsc.string), jsc.array, (getRegexFromFormats, array) => {
            let str = getRegexFromFormats(array);
            console.log('the regex generated: ' + str);
            
            return str.includes('.*\.(') && str.includes(')');
        });
    });*/

    it('should equal .*\.(txt|http) or .*\.(http|txt)', function() {
        let str = getRegexFromFormats(['.txt', '.http']);
        
        expect(str).to.satisfy(function(strr: string) {
            if (strr ===  '.*\.(txt|http)' ||
            strr === '.*\.(http|txt)')
            return true;
            
            return false;
        });
    });
});

describe("#retrieveSummary", function() {
    it('should fulfill on http summaries', function() {
        return retrieveSummary('http://www.economist.com/news/science-and-technology/21677188-it-rare-new-animal-species-emerge-front-scientists-eyes');


    });

    it("should fulfill on txt summaries", function() {
        return retrieveSummary('http://www.loremipsum.de/downloads/original.txt');
    });

    // change this if we decide to do the OCR stuff
    it('should not fulfill on pdf summaries', function() {
        return retrieveSummary('http://www.thewritesource.com/apa/apa.pdf');
    });

});
