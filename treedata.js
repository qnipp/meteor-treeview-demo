if (Meteor.isClient) {

  ViewModel.share({
    options: {
      create: true,
      rename: true,
      delete: true,
      copy: true,
      move: true,
      dnd: true,
      contextmenu: true,
      state: true,
      checkbox: false,
      sort: true,
      parentNode: null,
      selectNode: null,
      openAll: false,
      getNodes: false,
      configurationString: ""
    }
  });

  function recursiveCopy(id, parent) {
    let item = TreeData.findOne(id);
    delete item._id;
    item.parent = parent;
    let newId = TreeData.insert(item);

    TreeData.find({parent: id}).forEach(function(item) {
      recursiveCopy(item._id, newId);
    });
  }

  function recursiveDelete(id) {
    TreeData.find({parent: id}).forEach(function(item) {
      recursiveDelete(item._id);
    });
    TreeData.remove(id);
  }

  Template.TreeData.onCreated(function() {
    let instance = this;
    instance.message = new ReactiveVar('Messages will be put here.');
  });

  Template.TreeData.viewmodel({
    share: 'options',
    treeArgs() {

      let instance = Template.instance();

      let plugins = [];

      if (this.checkbox()) plugins.push('checkbox');
      if (this.contextmenu()) plugins.push('contextmenu');
      if (this.dnd()) plugins.push('dnd');
      if (this.sort()) plugins.push('sort');
      if (this.state()) plugins.push('state');

      config = {
        collection: TreeData,
        subscription: 'TreeData',
        parent: this.parentNode(),
        select: this.selectNode(),
        openAll: this.openAll(),
        mapping: {
          text: 'name',
          aAttr: function(item) {
            return {
              title: item._id
            };
          }
        },
        jstree: { plugins },
        events: {
          changed(e, item, data) {
            instance.message.set("Changing selection. " + item.length + " nodes are selected.");
          },
          create(e, item, data) {
            instance.message.set("Creating node on " + data.parent);
            return TreeData.insert({name: 'New node', parent: data.parent});
          },
          rename(e, item, data) {
            instance.message.set("Renaming " + item + " to " + data.text);
            TreeData.update(item, {$set: {name: data.text}});
          },
          delete(e, item, data) {
            instance.message.set("Deleting " + item);
            recursiveDelete(item);
          },
          copy(e, item, data) {
            if(data.parent == '#') {
              instance.message.set("Copying to the root is forbidden.");
              return false;
            }
            return instance.message.set("Recursively copying nodes.");
            recursiveCopy(item, data.parent);
          },
          move(e, item, data) {
            if(data.parent == '#') {
              instance.message.set("Moving to the root is forbidden.");
              return false;
            }
            instance.message.set("Recursively moving nodes.");
            TreeData.update(item, {$set: {parent: data.parent}});
          }
        }
      }

      if (!this.create()) delete config.events.create;
      if (!this.rename()) delete config.events.rename;
      if (!this.delete()) delete config.events.delete;
      if (!this.copy()) delete config.events.copy;
      if (!this.move()) delete config.events.move;

      if (this.getNodes()) config.getNodes = function(parent) {
        return TreeData.find({parent}, {sort: {name: -1}});
      }

      let configString = JSON.stringify(config, function(key, value) {
        if (key === '__proto__') {
          return undefined;
        }
        if (key === 'collection') {
          return '%%collection%%';
        }
        if (typeof value === 'function') {
          if (key === 'getNodes') return '%%function(parent) {…}%%';
          if (key === 'aAttr') return '%%function(item) {…}%%';
          return '%%function(e, item, data) {…}%%';
        }
        return value;
      }, 2);

      configString = configString.replace(/"?'?%%"?'?/g, '').replace(/\n/g, '\n  ');
      configString = 'Template.templatename.helpers({\n  treeArgs: ' + configString + '\n});';

      this.configurationString(configString);

      return config;
    },
    message() {
      return Template.instance().message.get();
    }
  });

  Template.Options.viewmodel({
    share: 'options',
    copymoveenable() {
      return this.contextmenu() || this.dnd();
    },
    selectOptions() {
      let options = TreeData.find().map(function(item) {
        return {id: item._id, name: item.name};
      });
      return options;
    },
    resetData() {
      Meteor.call('resetData');
    }
  });

  Template.Configuration.viewmodel({
    share: 'options',
    configurationRows() {
      return (this.configurationString() + '\n').match(/\n/g).length;
    }
  });
}
