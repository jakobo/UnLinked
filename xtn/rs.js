/**
 * Redefines some functionality for the APIs, adding support for "clean" methods
 */
IN.Event.on(IN, "frameworkLoaded", function() {

var REGEX_TILDE = /^\~$/,
    REGEX_BEGINS_WITH_URL = /^url=(.*)$/,
    DEFAULT_KEY_MAPPING = [
      {
        find: REGEX_TILDE,
        repl: "me"
      },
      {
        find: REGEX_BEGINS_WITH_URL,
        repl: "$1"
      }
    ],
    DEFAULT_KEY_FIELDS = ["key", "id", "uid", "uuid"],
    TYPE_NESTED_RS = "values",
    TYPE_OBJECT = "object",
    SCOPE_WINDOW = window;

/**
 * A static registry for RS objects
 * Used to insulate the RS object (and avoid having this.* properties)
 * @class IN.xtn.felocity.RS.ResultRegistry
 * @static
 */
Sslac.Static("IN.xtn.felocity.RS.ResultRegistry")

/**
 * get the ID for an object. It uses a === comparisson to locate the match
 * if no match is found, it's registered into the collection
 * @method getId
 * @param idObject {Object} the object to locate
 * @return {Integer} the matching index
 */
.Static("getId", function(idObject) {
  if (!IN.xtn.felocity.RS.ResultRegistry.OBJECTS) {
    IN.xtn.felocity.RS.ResultRegistry.OBJECTS = [];
  }
  var tmp = IN.xtn.felocity.RS.ResultRegistry.OBJECTS;
  var index = null;
  var found = false;
  for (var name in tmp) {
    if (tmp[name].obj === idObject) {
      index = name;
      found = true;
      break;
    }
  }

  if (!found) {
    index = IN.$uid();
    IN.xtn.felocity.RS.ResultRegistry.OBJECTS[index] = {
      obj: idObject,
      values: {},
      firstValue: null
    };
  }
  
  return index;
})

/**
 * Register an object
 * Place an object into the registry
 * @method register
 * @param idObject {instanceof IN.xtn.felocity.RS.Result} the object reference
 */
.Static("register", function(idObject) {
  var id = IN.xtn.felocity.RS.ResultRegistry.getId(idObject);
})

/**
 * Set a value for an object
 * @method setValue
 * @param idObject {IN.xtn.felocity.RS.Result} the object reference
 * @param name {String} the name
 * @param value {Object} the value to store
 */
.Static("setValue", function(idObject, name, value) {
  var id = IN.xtn.felocity.RS.ResultRegistry.getId(idObject);
  IN.xtn.felocity.RS.ResultRegistry.OBJECTS[id].values[name] = value;
})

/**
 * Set a first value property of an object
 * @method setFirstValue
 * @param idObject {IN.xtn.felocity.RS.Result} the object reference
 * @param value {Object} the value to store
 */
.Static("setFirstValue", function(idObject, value) {
  var id = IN.xtn.felocity.RS.ResultRegistry.getId(idObject);
  IN.xtn.felocity.RS.ResultRegistry.OBJECTS[id].firstValue = value;
})

/**
 * get the values associated with an RS object
 * @method getValues
 * @param idObject {IN.xtn.felocity.RS.Result} the object reference
 * @return {Object}
 */
.Static("getValues", function(idObject) {
  var id = IN.xtn.felocity.RS.ResultRegistry.getId(idObject);
  return IN.xtn.felocity.RS.ResultRegistry.OBJECTS[id].values;
})

/**
 * get the first value associated with an RS object
 * @method getFirstValue
 * @param idObject {IN.xtn.felocity.RS.Result} the object reference
 * @return {Object}
 */
.Static("getFirstValue", function(idObject) {
  var id = IN.xtn.felocity.RS.ResultRegistry.getId(idObject);
  return IN.xtn.felocity.RS.ResultRegistry.OBJECTS[id].firstValue;
})

/**
 * recursively destroys the RS object in the registry
 * @method destroy
 * @param idObject {IN.xtn.felocity.RS.Result} the object reference
 */
.Static("destroy", function(idObject) {
  var id = IN.xtn.felocity.RS.ResultRegistry.getId(idObject);
  
  // recursively clean up nested RS objects
  var obj = IN.xtn.felocity.RS.ResultRegistry.OBJECTS[id].obj;
  for (name in obj) {
    if (typeof obj[name] == "object" && obj[name] instanceof IN.xtn.felocity.RS.Result) {
      obj[name].destroy();
    }
  }
  
  // delete itself from the registry
  IN.xtn.felocity.RS.ResultRegistry.OBJECTS[id] = null;
  delete IN.xtn.felocity.RS.ResultRegistry.OBJECTS[id];
});

/**
 * Creates an RS object for handling LinkedIn results
 * @class IN.APIResults
 * @constructor
 * @param data {Object} the result object
 * @param useNestedData {String} [optional] the location of the data (if not top level)
 * @param keyFields {Array} [optional] an array of strings to use for locating keys
 */
Sslac.Class("IN.xtn.felocity.RS.Result")
.Constructor(function(data, useNestedData, keyFields, keyMapping) {
  var parsedData,
      isParsed = false,
      setValueFn = IN.xtn.felocity.RS.ResultRegistry.setValue,
      setFirstValueFn = IN.xtn.felocity.RS.ResultRegistry.setFirstValue;
  
  keyFields = keyFields || DEFAULT_KEY_FIELDS;
  keyMapping = keyMapping || DEFAULT_KEY_MAPPING;
  
  IN.xtn.felocity.RS.ResultRegistry.register(this);
  
  function normalizeKey(key) {
    for (var i = 0, len = keyMapping.length; i < len; i++) {
      key = (key+"").replace(keyMapping[i].find, keyMapping[i].repl);
    }
    return key;
  }
  
  function getKey(rs, original) {
    var ret = original;
    for (var i = 0, len = keyFields.length; i < len; i++) {
      if (rs[keyFields[i]]) {
        ret = normalizeKey(rs[keyFields[i]]);
        break;
      }
    }
    return ret;
  }
  
  if (useNestedData) {
    parsedData = data[useNestedData];
    isParsed = true;
  }
  else {
    parsedData = data;
  }
  
  for (var name in parsedData) {
    var item = parsedData[name];
    name = name.replace(/^_+/, "");
    if (name == TYPE_NESTED_RS) {
      for (var i = 0, len = item.length; i < len; i++) {
        var valuesItem = new IN.xtn.felocity.RS.Result(item[i]);
        var key = getKey(valuesItem, i);
        setValueFn(this, key, valuesItem);
        if (i === 0) {
          setFirstValueFn(this, valuesItem);
        }
      }
    }
    else if (typeof(item) == TYPE_OBJECT) {
      setValueFn(this, name, new IN.xtn.felocity.RS.Result(item));
    }
    else {
      setValueFn(this, name, item);
    }
  }
})

/**
 * Export the RS object as a normal JavaScript object
 * This removes all properties and returns it as just a data object,
 * for things like JSON
 * @method $object
 * @param fn {Function} a callback function to use for the result
 * @param scope {Object} [optional] the scope to run the callback in
 * @param obj {Object} [optional] an optional object to pass to the callback
 * @return this
 */
.Method("$object", function(fn, scope, obj) {
  var out = {};
  var item;
  var values = IN.xtn.felocity.RS.ResultRegistry.getValues(this);
  for (var name in values) {
    item = values[name];
    out[name] = (typeof(item) === "object" && item instanceof IN.xtn.felocity.RS.Result) ? item.$object() : item;
  }
  
  if (!fn) {
    return out;
  }
  
  scope = scope || SCOPE_WINDOW;
  fn.call(scope, out, obj);
  return this;
})

/**
 * return the first object of the collection
 * @method $first
 * @param fn {Function} a callback function to use for the result
 * @param scope {Object} [optional] the scope to run the callback in
 * @param obj {Object} [optional] an optional object to pass to the callback
 * @return this
 */
.Method("$first", function(fn, scope, obj) {
  scope = scope || SCOPE_WINDOW;
  fn.call(scope, IN.xtn.felocity.RS.ResultRegistry.getFirstValue(this), obj);
  return this;
})

/**
 * return a callback method for each item in the collection
 * @method $each
 * @param fn {Function} a callback function to use for the result
 * @param scope {Object} [optional] the scope to run the callback in
 * @param obj {Object} [optional] an optional object to pass to the callback
 * @return this
 */
.Method("$each", function(fn, scope, obj) {
  scope = scope || SCOPE_WINDOW;
  var values = IN.xtn.felocity.RS.ResultRegistry.getValues(this);
  for (var name in values) {
    fn.call(scope, values[name], obj);
  }
  return this;
})

/**
 * return the entire collection of objects
 * @method $all
 * @param fn {Function} a callback function to use for the result
 * @param scope {Object} [optional] the scope to run the callback in
 * @param obj {Object} [optional] an optional object to pass to the callback
 * @return this
 */
.Method("$all", function(fn, scope, obj) {
  scope = scope || SCOPE_WINDOW;
  var values = IN.xtn.felocity.RS.ResultRegistry.getValues(this);
  fn.call(scope, values, obj);
  return this;
})

/**
 * Destroys the RS object
 * This takes care of possible memory issues by removing it from
 * the registry. Once the object has been destroyed, no additional methods
 * can be called on it
 * @method destroy
 * @return null
 */
.Method("destroy", function() {
  IN.xtn.felocity.RS.ResultRegistry.destroy(this);
  return null;
});


// modifies IN.API to add a toRS method
Sslac.definitionOf("IN.API")
.Static("toRS", function(data, useNestedData, keyFields, keyMapping) {
  return new IN.xtn.felocity.RS.Result(data, useNestedData, keyFields, keyMapping);
});

// Loaded successfully
IN.ENV.js.extensions.rs.loaded = true;

}); // end on framework loaded