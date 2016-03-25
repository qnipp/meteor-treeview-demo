Meteor.methods({
  resetData() {
    let testData = {
      Earth: {
        Europe: {
          Austria: {
            Vienna: null,
            Graz: null,
            Salzburg: null
          },
          Germany: {
            Berlin: null,
            Köln: null,
            Hamburg: null
          },
          Italy: {
            Roma: null,
            Venice: null,
            Trieste: null
          }
        } ,
        America: {
          "United States of America": {
            "New York": null,
            Philadelphia: null,
            "San Francisco": null
          }
        }
      }
    };

    function insertTestData(parent, data) {
      for (let name in data) {
        let id = TreeData.insert({name, parent});
        if (typeof data[name] === 'object') insertTestData(id, data[name]);
      }
    }

    TreeData.remove({});
    insertTestData(null, testData);
  }
})
