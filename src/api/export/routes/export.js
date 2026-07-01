module.exports = {
    routes: [
      {
        method: "POST",
        path: "/export-selected",
        handler: "export.exportSelected",
        config: {
          auth: false, // we'll secure later
        },
      },
    ],
  };