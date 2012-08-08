require.config({
    baseUrl: "/js"
});

requirejs(["lib/chai"], function (chai) {
    "use strict";

    mocha.setup({ui: "bdd", globals: ["console"], timeout: 2000000000});
    chai.should();

    require(["test/core", "test/views"], function (testCore, testViews) {
        mocha.run();
    });
});
