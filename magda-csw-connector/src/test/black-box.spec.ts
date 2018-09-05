"use strict";

const child = require("child_process");

const express = require("express");
const body = require("body-parser");

function runMockCSW(port: number) {
    const csw = express();

    csw.all("*", body.json(), function(req: any, res: any) {
        console.log("CSW", req.method, req.path, req.query, req.body);

        res.set("Content-type", "text/xml").send(CSW_RESPONSE);
    });

    console.log("CSW", port);

    return csw.listen(port);
}

import { MockRegistry } from "./MockRegistry";

describe("connector", function() {
    function run(done: any) {
        const command = [
            "src",
            "--id=connector",
            "--name=Connector",
            "--sourceUrl=http://localhost:8888",
            "--registryUrl=http://localhost:8889",
            "--jwtSecret=nerdgasm",
            "--userId=user"
        ];
        const proc = child.spawn("ts-node", command, {
            stdout: process.stdout,
            stderr: process.stderr
        });
        proc.on("close", function() {
            console.log(arguments);
            done();
        });
    }

    let csw: any, registry: any;

    beforeEach(function() {
        csw = runMockCSW(8888);
        registry = new MockRegistry();
        registry.run(8889);
    });

    afterEach(function() {
        csw.close();
        registry.server.close();
    });

    it("should run", function(done) {
        this.timeout(10000);
        run(() => {
            for (const record of Object.values(registry.records)) {
                try {
                    delete record.aspects["csw-dataset"].xml;
                } catch (e) {}
                console.log(JSON.stringify(record, null, 2));
            }
            done();
        });
    });
});

const CSW_RESPONSE = require("fs").readFileSync(
    require("path").join(__dirname, "csw1.xml")
);
