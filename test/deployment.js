"use strict";

var assert = require("assert");
var testUtils = require("./test-utils");
var api;

var gitUrl1 = "https://github.com/itsananderson/kudu-api-website.git";
var gitUrl2 = "https://github.com/itsananderson/kudu-api-website.git#1f19ea3b8e68397b6f7c290378526ef37975105d";

describe("deployment", function () {
    this.timeout(5000);

    var deploymentList;

    before(testUtils.setupKudu(function (kuduApi) {
        api = kuduApi;
    }));

    before(function (done) {
        this.timeout(30 * 1000);

        api.deployment.deploy(gitUrl1, function (err) {
            if (err) {
                return done(err);
            }

            api.deployment.deploy(gitUrl2, function (err) {
                if (err) {
                    return done(err);
                }

                api.deployment.list(function (err, result) {
                    if (err) {
                        return done(err);
                    }

                    deploymentList = result.data;
                    done();
                });
            });
        });
    });

    it("can list all deployments", function (done) {
        api.deployment.list(function (err, result) {
            if (err) {
                return done(err);
            }

            assert(Array.isArray(result.data), "Deployments should be an array");
            done();
        });
    });

    it("can get a single deployment", function (done) {
        api.deployment.get(deploymentList[0].id, function (err, result) {
            if (err) {
                return done(err);
            }

            assert.equal(result.data.id, deploymentList[0].id, "Deployment id should match the one queried");
            done();
        });
    });

    it("can deploy a previous deployment", function (done) {
        this.timeout(30 * 1000);

        api.deployment.redeploy(deploymentList[0].id, function (err) {
            if (err) {
                return done(err);
            }

            api.deployment.get(deploymentList[0].id, function (err, result) {
                if (err) {
                    return done(err);
                }

                var deployment = result.data;

                assert.equal(deployment.id, deploymentList[0].id, "Deployment id should match the one queried");
                assert(deployment.active, "Deployment should be active");
                done();
            });
        });
    });

    it("can delete a deployment", function (done) {
        api.deployment.list(function (err, result) {
            if (err) {
                return done(err);
            }

            var oldDeployments = result.data;
            var deploymentId = oldDeployments.filter(function (d) {
                return !d.active;
            })[0].id;

            api.deployment.del(deploymentId, function (err) {
                if (err) {
                    return done(err);
                }

                api.deployment.list(function (err, result) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(result.data.length, oldDeployments.length - 1, "Deployment count should be one less after deletion");
                    done();
                });
            });
        });
    });

    it("can get a deployment log", function (done) {
        api.deployment.log(deploymentList[0].id, function (err, result) {
            if (err) {
                return done(err);
            }

            assert(Array.isArray(result.data), "number", "Deployment log entries should be an array");
            done();
        });
    });

    it("can get a deployment log entry", function (done) {
        var deploymentId = deploymentList[0].id;

        api.deployment.log(deploymentId, function (err, result) {
            var entry = result.data.filter(function (entry) {
                return !!entry.details_url;
            })[0];

            api.deployment.logDetails(deploymentId, entry.id, function (err, result) {
                if (err) {
                    return done(err);
                }

                assert(result.data);
                done();
            });
        });
    });
});
