Meteor.startup(() => {
  if(TreeData.find().count() === 0) {

    Meteor.call("resetData");
    console.log("Filled collection TreeData");

  }
});
