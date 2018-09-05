const express = require("express");
const body = require("body-parser");

export class MockRegistry {
    aspects: any = {};
    records: any = {};
    server: any;

    run(port: number) {
        const registry: any = express();

        registry.use(
            body.json({
                limit: "500000kb"
            })
        );

        registry.put("/aspects/:id", (req: any, res: any) => {
            this.aspects[req.params.id] = req.body;
            res.json(req.body);
        });

        registry.put("/records/:id", (req: any, res: any) => {
            this.records[req.params.id] = req.body;
            res.json(req.body);
        });

        registry.all("*", function(req: any, res: any) {
            console.log("REG", req.method, req.path, req.body);
        });

        return (this.server = registry.listen(port));
    }
}
