Meteor.publish('TreeData', function() {
  return TreeData.find();
});
