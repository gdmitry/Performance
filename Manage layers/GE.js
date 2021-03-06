/*
Udacity's library for immediate front-end feedback.
*/

/**
 * Exposes UdacityFEGradingEngine (Grading Engine) interface
 * @return {Object} exports - the functions on the exports object
 */
;window.UdacityFEGradingEngine ? window.UdacityFEGradingEngine = window.UdacityFEGradingEngine : window.UdacityFEGradingEngine = (function(window, undefined) {
  'use strict';
  var exports = {};

// http://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
function arrEquals(array1, array2) {
  if (!array1 || !array2) {
    return false;
  }
  if (array1.length != array2.length) {
    return false;
  }
  for (var i = 0, l = array1.length; i < l; i++) {
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      if (!array1[i].equals(array2[i])) {
        return false;
      }
    } else if (array1[i] != array2[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}

/**
 * Creates an Array of DOM nodes that match the selector
 * @param selector {string} CSS selector - selector to match against
 * @param  {DOM node} parent - parent for starting point
 * @return {array} Array of DOM nodes
 */
function getDomNodeArray(selector, parent) {
  if (!selector) {
    return [];
  }
  parent = parent || document;
  var nodes = Array.prototype.slice.apply(parent.querySelectorAll(selector));
  return nodes;
}

// modified from http://stackoverflow.com/questions/7960335/javascript-is-given-function-empty
Function.prototype.getBody = function() {
  // Get content between first { and last }
  var m = this.toString().match(/\{([\s\S]*)\}/m)[1];
  // strip whitespace http://stackoverflow.com/questions/14540094/javascript-regular-expression-for-removing-all-spaces-except-for-what-between-do
  m = m.replace(/([^"]+)|("[^"]+")/g, function($0, $1, $2) {
    if ($1) {
      return $1.replace(/\s/g, '');
    } else {
      return $2;
    }
  });
  // Strip comments
  return m.replace(/^\s*\/\/.*$/mg, '');
};

// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
// Use only if necessary...
function executeFunctionByName(functionName, context) {
  var args = [].slice.call(arguments).splice(2);
  var namespaces = functionName.split('.');
  var func = namespaces.pop();
  for (var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(this, args);
}

/**
 * Get the actual number from a measurement.
 * @param  {String} measurement - the measurement to strip
 * @return {Number} - the number inside
 */
function getUnitlessMeasurement(measurement) {
  if (typeof measurement === 'number') {
    return measurement;
  } else if (typeof measurement === 'string') {
    return measurement.match(/\d+/g)[0];
  } else {
    return NaN;
  }
}

// Inspired by http://www.dustindiaz.com/async-method-queues
// also helpful http://www.mattgreer.org/articles/promises-in-wicked-detail/

function Queue() {
  this._methods = [];
  this._flushing = false;
  this._blocked = false;
}

Queue.prototype = {
  add: function(fn) {
    this._methods.push(fn);
    if (!this._flushing && !this._blocked) {
      this.step();
    }
  },

  clear: function() {
    this._flushing = false;
    this._methods = [];
  },

  step: function() {
    var self = this;

    if (!this._flushing) {
      this._flushing = true;
    }

    function executeInPromise(fn) {
      return new Promise(function (resolve, reject) {
        if (fn) {
          try {
            var ret = fn();
          } catch (e) {
            self.block();
          }
        }
        resolve(ret);
      });
    }
    if (!this._blocked) {
      executeInPromise(this._methods.shift()).then(function(resolve) {
        if (self._methods.length > 0) {
          self.step();
        }
      })
    }
  },

  block: function() {
    this._blocked = true;
  },

  unblock: function() {
    this._blocked = false;
    this.step();
  }
};

/**
Targets are:
  * nested into a tree-like structure called a bullseye
  * usually mapped 1:1 with DOM elements

The top-level target living directly on the TA will not map to any element. But it contains children which do map 1:1 with elements.
 */

/**
 * Target constructor sets the target defaults. It includes a unique id number for private tracking.
 */
function Target() {
  this.id = parseInt(Math.random() * 1000000);
  this.element = null;
  this.value = null;
  this.operation = null;
  this.children = [];
  this.index = null;
  this.correct = false;
};

Object.defineProperties(Target.prototype, {
  hasChildren: {
    /**
     * Public method for determining if a Target has child Targets.
     * @return {Boolean} hasKids - true if there are chldren, false otherwise.
     */
    get: function() {
      var hasKids = false;
      if (this.children.length > 0) {
        hasKids = true;
      };
      return hasKids;
    }
  },
  hasValue: {
    /**
     * Public method for determining if a value exists on a Target.
     * @return {Boolean} somethingThere - true if a value exists, false otherwise.
     */
    get: function() {
      var somethingThere = false;
      if (this.value !== null && this.value !== undefined) {
        somethingThere = true;
      };
      return somethingThere;
    }
  },
  hasGrandkids: {
    /**
     * Public method for determining if a Target's children have children.
     * @return {Boolean} hasGrandKids - true if there are grandchildren, false otherwise.
     */
    get: function() {
      var gotGrandKids = false;
      gotGrandKids = this.children.some(function (kid) {
        return kid.hasChildren;
      });
      return gotGrandKids;
    }
  }
});

/**
The GradeBook maintains and reports on the state of a set of questions registered by the TA. The GradeBook reports out on the final state of each active_test.
*/

/**
 * The GradeBook constructor sets questions and passed to default values.
 */
function GradeBook() {
  this.questions = [];
  this.passed = false;
};

Object.defineProperties(GradeBook.prototype, {
  numberOfQuestions: {
    /**
     * Find the number of questions.
     * @return {Number} number of questions
     */
    get: function() {
      return this.questions.length;
    }
  },
  numberCorrectQuestions: {
    /**
     * Find the number of questions evaluated as correct.
     * @return {Number} numberCorrect - number of correct questions.
     */
    get: function() {
      var numberCorrect = 0;
      this.questions.forEach(function(question) {
        if (question.correct) {
          numberCorrect += 1;
        }
      })
      return numberCorrect;
    }
  },
  allCorrect: {
    /**
     * Compares the total questions to total questions correct.
     * @return {Boolean} isAllGood - true if all are correct and false otherwise.
     */
    get: function() {
      var isAllGood = false;
      if (this.numberOfQuestions === this.numberCorrectQuestions && this.numberOfQuestions > 0) {
        isAllGood = true;
      }
      return isAllGood;
    }
  },
  numberWrongQuestions: {
    /**
     * Find the number of wrong questions.
     * @return {Number} numberWrong - the number of wrong questions.
     */
    get: function() {
      var numberWrong = 0;
      numberWrong = numberOfQuestions - numberCorrectQuestions;
      return numberWrong;
    }
  },
  report: {
    /**
     * Returns all questions and the overall correctness of the active_test. Note: this is the data returned to the active_test component.
     * @return {Object} - contains a boolean indicating whether the test passes and an array of all questions.
     */
    get: function() {
      return {
        isCorrect: this.passed,
        questions: this.questions
      };
    }
  }
});

/**
 * Takes in a set of values from the target. Adds to gradebook.
 * @param {object} target - only what the GradeBook needs to know about the Target
 */
GradeBook.prototype.recordQuestion = function(target) {
  target.correct = false;
  this.questions.push(target);
};

/**
 * Empties the questions array and ensures that the test hasn't passed prematurely. Called each time a new question is registered.
 */
GradeBook.prototype.reset = function() {
  this.questions = [];
  this.passed = false;
};

/**
 * Will iterate through all the questions and return if they meet grade criteria
 * @param  {Object} config - {String} config.strictness, {Boolean} config.not, {Function} config.callback
 * @return {Object} the report from the gradebook instance containing whether the test passed and all of the questions in consideration.
 */
GradeBook.prototype.grade = function(config) {
  var strictness;
  var not;
  var callback;
  strictness = config.strictness;
  not = config.not;
  callback = config.callback;

  this.questions.forEach(function(question) {
    question.correct = callback(question);

    if (not) {
      question.correct = !question.correct;
    }
  });

  if (strictness === 'some') {
    if (this.numberCorrectQuestions <= this.numberOfQuestions && this.numberCorrectQuestions > 0) {
      this.passed = true;
    };
  } else if (typeof strictness === 'number' && strictness > 0) {
    if (this.numberCorrectQuestions <= strictness && this.numberCorrectQuestions > 0) {
      this.passed = true;
    }
  } else {
    this.passed = this.allCorrect;
  }

  // one last check to make sure there actually were questions
  if (this.numberOfQuestions === 0 && not) {
    this.passed = !this.passed;
  };
  return this.report;
};

/**
The Teaching Assistant (TA) is responsible for:
  * collecting data from the page and creating a tree of Targets (called a bullseye) representing the information
  * traverseing the bullseye and reporting relevant data from Targets and grading instructions into a GradeBook.
  * All collectors return the instance of the TA object for chaining.
  * Collectors register their operations with the GradeBook, which actually checks the results of the tests.
*/

/**
 * The TA constructor sets default values and instantiates a GradeBook.
 */
function TA(description) {
  this.target = null;
  this.gradebook = new GradeBook();
  this.operations = [];
  this.gradeOpposite = false;
  this.picky = false;
  this.queue = new Queue();
  this.description = description;
};

Object.defineProperties(TA.prototype, {
  childPosition: {
    /**
     * To find a child node's index in relation to its immediate siblings
     * @return {object} TA - the TA instance for chaining.
     */
    get: function() {
      var self = this;
      this.queue.add(function() {
        self._runAgainstBottomTargets(function(target) {
          var elem = target.element;
          var position = null;
          // TODO: correct for other non-normal DOM elems?
          var ignoreTheseNodes = 0;
          Array.prototype.slice.apply(target.element.parentNode.children).forEach(function(val, index) {
            if (val.nodeName === '#text') {
              ignoreTheseNodes += 1;
            }
            if (val === elem) {
              position = index - ignoreTheseNodes;
            }
          });
          return position;
        });
      });
      return this;
    }
  },
  count: {
    /**
     * To count the number of children at the bottom level of the bullseye
     * @return {object} TA - the TA instance for chaining.
     */
    get: function() {
      var self = this;
      this.queue.add(function() {
        // doing more than accessing a property on existing target because counting can move up the bullseye to past Targets. Need to reset operations
        self._registerOperation('count');
        self._runAgainstNextToBottomTargets(function(target) {
          var length = null;
          try {
            length = target.children.length;
          } catch (e) {
            length = 0;
          }
          return length;
        });
      });
      return this;
    }
  },
  innerHTML: {
    /**
     * To pull the innerHTML of a DOM node.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function() {
      var self = this;
      this.queue.add(function() {
        self._registerOperation('innerHTML');
        self._runAgainstBottomTargetElements(function(element) {
          var html = '';
          try {
            html = element.innerHTML;
          } catch (e) {
            self.onerror('Cannot get innerHTML. Element probably doesn\'t exist.', true);
          }
          return html;
        });
      });
      return this;
    }
  },
  _targetIds: {
    /**
     * Not a collector! Private use only. Get an array of all target ids.
     * @return {array} ids of all targets in the bullseye.
     */
    get: function() {
      var ids = [];
      this._traverseTargets(function(target) {
        ids.push(target.id);
      });
      return ids;
    }
  },
  UAString: {
    /**
     * Get the User-Agent string of the browser.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function() {
      var self = this;
      this.queue.add(function() {
        self._registerOperation('UAString');
        self.target = new Target();
        self._runAgainstTopTargetOnly(function(topTarget) {
          var ua = '';
          try {
            ua = navigator.userAgent;
          } catch (e) {
            self.onerror('Can\'t find a user agent string.', true);
          }
          return ua;
        })
      });
      return this;
    }
  },
  DPR: {
    /**
     * Get the Device Pixel Ratio of the viewport.
     * @return {object} TA - the TA instance for chaining.
     */
    get: function() {
      var self = this;
      this.queue.add(function() {
        self._registerOperation('DPR');
        self.target = new Target();
        self._runAgainstTopTargetOnly(function(topTarget) {
          var dpr = null;
          try {
            dpr = +window.devicePixelRatio;
          } catch (e) {
            self.onerror('Can\'t find device pixel ratio.', true);
          }
          return dpr;
        })
      });
      return this;
    }
  }
})

/**
 * Initialized for async call later.
 */
TA.prototype.onresult = function(testResult) {};

/**
 * Let the TA know this just happened and refresh the questions in the GradeBook.
 * @param {string} operation - the thing that just happened
 */
TA.prototype._registerOperation = function(operation) {
  this.operations.push(operation);
  this.gradebook.reset();
};

/**
 * Private method to traverse all targets in the bullseye.
 * @param  {Function} callback - method to call against each target
 */
TA.prototype._traverseTargets = function(callback) {
  // http://www.timlabonne.com/2013/07/tree-traversals-with-javascript/

  /**
   * Recursively dive into a tree structure from the top. Used on the Target structure here.
   * @param  {object} node - a target of bullseye. Start with the top.
   * @param  {function} callback - function to run against each node
   */
  function visitDfs (node, callback) {
    if (callback) {
      callback(node);
    }

    node.children.forEach(function(child, index, arr) {
      visitDfs(child, callback);
    });
  };
  visitDfs(this.target, callback);
};

/**
 * Run a function against the top-level Target in the bullseye
 * @param  {function} callback - the function to run against specified Targets
 */
TA.prototype._runAgainstTopTargetOnly = function(callback) {
  var self = this;
  this.target.value = callback(this.target);

  if (this.target.value != undefined) {
    self.gradebook.recordQuestion(this.target);
  } else {
    this.target.children.forEach(function(kid) {
      self.gradebook.recordQuestion(kid);
    });
  }
};

/**
 * Run a function against bottom targets in the bullseye
 * @param  {function} callback - the function to run against specified Targets
 */
TA.prototype._runAgainstBottomTargets = function(callback) {
  var self = this;

  var allTargets = this._targetIds;

  this._traverseTargets(function(target) {
    if (!target.hasChildren && allTargets.indexOf(target.id) > -1) {
      target.value = callback(target);

      if (target.value != undefined) {
        self.gradebook.recordQuestion(target);
      } else {
        target.children.forEach(function(kid) {
          self.gradebook.recordQuestion(kid);
        });
      }
    };
  });
};

/**
 * Run a function against the elements of the bottom targets in the bullseye
 * @param  {function} callback - the function to run against specified elements
 */
TA.prototype._runAgainstBottomTargetElements = function(callback) {
  var self = this;

  var allTargets = this._targetIds;

  this._traverseTargets(function(target) {
    if (!target.hasChildren && allTargets.indexOf(target.id) > -1) {
      target.value = callback(target.element);

      if (target.value != undefined) {
        self.gradebook.recordQuestion(target);
      } else {
        target.children.forEach(function(kid) {
          self.gradebook.recordQuestion(kid);
        });
      }
    };
  })
};

/**
 * Run a function against the next to bottom targets in the bullseye
 * @param  {function} callback - the function to run against specified elements
 */
TA.prototype._runAgainstNextToBottomTargets = function(callback) {
  var self = this;

  this._traverseTargets(function(target) {
    if (target.hasChildren && !target.hasGrandkids) {
      target.value = callback(target);

      if (target.value != undefined) {
        self.gradebook.recordQuestion(target);
      } else {
        target.children.forEach(function(kid) {
          self.gradebook.recordQuestion(kid);
        });
      }
    };
  });
};

/**
 * Generates the top-level target. Matched elements end up as children targets. It will not have a element.
 * @param  {string} CSS selector - the selector of the elements you want to query
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.theseElements = function(selector) {
  var self = this;
  this.queue.add(function() {
    self._registerOperation('gatherElements');

    self.target = new Target();

    self._runAgainstTopTargetOnly(function(topTarget) {
      var elems = getDomNodeArray(selector);

      if (!selector) {
        self.onerror('Cannot find elements without a selector.', true);
      } else if (elems.length > 0) {
        elems.forEach(function(elem, index, arr) {
          var target = new Target();
          target.element = elem;
          target.index = index;
          topTarget.children.push(target);
        });
      }
    });
  });
  return this;
}
// more common syntax
TA.prototype.nodes = TA.prototype.theseElements;

/**
 * Will run a query against the lowest level targets in the Target tree. Note it will traverse all the way down the DOM.
 * @param  {string} CSS selector - the selector of the children you want to query
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.deepChildren = function(selector) {
  var self = this;
  this.queue.add(function() {
    self._registerOperation('gatherDeepChildElements');

    self._runAgainstBottomTargets(function(target) {
      var elems = getDomNodeArray(selector, target.element);

      if (!selector) {
        self.onerror('Cannot find elements without a selector.', true);
        throw new Error();
      } else if (target.element) {
        elems.forEach(function(newElem, index) {
          var childTarget = new Target();
          childTarget.element = newElem;
          childTarget.index = index;
          target.children.push(childTarget);
        });
      }
    });
  });
};
// for alternate syntax options
TA.prototype.children = TA.prototype.deepChildren;

TA.prototype.get = function(typeOfValue) {
  var self = this;
  switch (typeOfValue) {
    case 'count':
      self.count;
      break;
    case 'childPosition':
      self.childPosition;
      break;
    case 'innerHTML':
      self.innerHTML;
      break;
    case 'UAString':
      self.UAString;
      break;
    case 'DPR':
      self.DPR;
      break;
    default:
      self.onerror('Cannot \'get\': \'' + typeOfValue + '\'. Options include: \'count\', \'childPosition\', \'DPR\', \'innerHTML\', and \'UAString\'.');
      throw new Error();
      break;
  }
};

TA.prototype.limit = function(limit) {
  var self = this;

  if (!limit || limit < 1) {
    self.onerror('Illegal \'limit\'. Options include: any positive number, \'all\' or \'some\'. Defaults to \'all\'');
    throw new Error();
  }

  this.queue.add(function() {
    self.strictness = limit;
  });

  return this;
};

/**
 * Get any CSS style of any element.
 * @param  {string} property - the CSS property to examine. Should be camelCased.
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.cssProperty = function(property) {
  var self = this;
  this.queue.add(function() {
    self._registerOperation('cssProperty');

    self._runAgainstBottomTargetElements(function(elem) {
      var styles = {};
      var style = null;
      try {
        // TODO: this causes a FSL that could affect framerate?
        styles = window.getComputedStyle(elem);
        style = styles[property];
      } catch (e) {
        self.onerror('Cannot get CSS property: \'' + property + '\'.', true);
      }
      return style;
    });
  });
  return this;
}

/**
 * Get any attribute of any element.
 * @param  {string} attribute - the attribute under examination.
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.attribute = function(attribute) {
  var self = this;
  this.queue.add(function() {
    self._registerOperation('attribute');

    self._runAgainstBottomTargetElements(function(elem) {
      var attrValue = null;
      try {
        attrValue = elem.getAttribute(attribute);
      } catch (e) {
        self.onerror("Cannot get attribute '" + attribute + "'.", true);
      }
      if (attrValue === '') {
        attrValue = true;
      }
      return attrValue;
    });
  });
  return this;
}

/**
 * Get any property of an object.
 * @param  {string} attribute - the attribute under examination.
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.property = function(key) {
  var self = this;
  this.queue.add(function() {
    self._registerOperation('property');

    self._runAgainstBottomTargetElements(function(obj) {
      var propertyValue = null;
      try {
        propertyValue = obj[key];
      } catch (e) {
        self.onerror("Cannot get attribute '" + attribute + "'.", true);
      }
      if (propertyValue === '') {
        propertyValue = true;
      }
      return propertyValue;
    });
  });
  return this;
}

/**
 * Get the position of one side of an element relative to the viewport
 * @param  {string} side - the side of the element in question
 * @return {object} TA - the TA instance for chaining.
 */
TA.prototype.absolutePosition = function(side) {
  var self = this;
  this.queue.add(function() {
    self._registerOperation('absolutePosition');
    // http://stackoverflow.com/questions/2880957/detect-inline-block-type-of-a-dom-element
    function getDisplayType (element) {
      var cStyle = element.currentStyle || window.getComputedStyle(element, '');
      return cStyle.display;
    };

    var selectorFunc = function() {};
    switch (side) {
      case 'top':
        var selectorFunc = function(elem) {
          var displayType = getDisplayType(elem);
          var value = NaN;
          if (displayType === 'block') {
            value = elem.offsetTop;
          } else if (displayType === 'inline') {
            value = elem.getBoundingClientRect()[side];
          };
          return value;
        };
        break;
      case 'left':
        var selectorFunc = function(elem) {
          var displayType = getDisplayType(elem);
          var value = NaN;
          if (displayType === 'block') {
            value = elem.offsetLeft;
          } else if (displayType === 'inline') {
            value = elem.getBoundingClientRect()[side];
          };
          return value;
        };
        break;
      case 'bottom':
        var selectorFunc = function(elem) {
          var displayType = getDisplayType(elem);
          var value = NaN;
          if (displayType === 'block') {
            value = elem.offsetTop + elem.offsetHeight;
          } else if (displayType === 'inline') {
            value = elem.getBoundingClientRect()[side];
          };
          if (value === Math.max(document.documentElement.clientHeight, window.innerHeight || 0)) {
            value = 'max';
          };
          return value;
        };
        break;
      case 'right':
        var selectorFunc = function(elem) {
          var displayType = getDisplayType(elem);
          var value = NaN;
          if (displayType === 'block') {
            value = elem.offsetLeft + elem.offsetWidth;
          } else if (displayType === 'inline') {
            value = elem.getBoundingClientRect()[side];
          };
          if (value === Math.max(document.documentElement.clientWidth, window.innerWidth || 0)) {
            value = 'max';
          };
          return value;
        };
        break;
      default:
        selectorFunc = function() {
          console.log("You didn't pick a side for absolutePosition! Options are 'top', 'left', 'bottom' and 'right'.");
          return NaN;
        };
        break;
    };

    self._runAgainstBottomTargetElements(function(elem) {
      var absPos = null;
      try {
        absPos = selectorFunc(elem);
      } catch (e) {
        self.onerror("Cannot get absolute position of '" + side + "'.", true);
        throw new Error();
      }
      return absPos;
    });
  });
  return this;
};

/**
 * Must be used with noRepeat: true
 * Waits for an event. Grades against event.detail
 * @param  {String} eventName - custom event to listen for
 * @return {Object} TA for chaining
 */
TA.prototype.waitForEvent = function(eventName) {
  var self = this;
  self.queue.block();
  window.addEventListener(eventName, function(e) {
    self.queue.unblock();
    self._runAgainstTopTargetOnly(function(topTarget) {
      return e.detail;
    });
  });
  this.queue.add(function() {
    self._registerOperation('gatherElements');
    self.target = new Target();
  });
  return this;
};

/**
Reporters live on the TA and are responsible for:
  * giving the GradeBook instructions for evaluating the questions it has collected.
  * instantiating the grading process by calling gradebook.grade()

 */

/**
 * Checks that either values or elements exist on questions in GradeBook.
 */
TA.prototype.exists = function(bool) {
  var self = this;

  if (bool === false && typeof bool === 'boolean') {
    self.not(true);
  }

  this.queue.add(function() {
    var typeOfOperation = self.operations[self.operations.length - 1];

    var doesExistFunc = function() {};
    switch (typeOfOperation) {
      case 'gatherElements':
        doesExistFunc = function(topTarget) {
          var doesExist = false;
          if (topTarget.children.length > 0 || topTarget.element || topTarget.value) {
            doesExist = true;
          }
          if (!doesExist) {
            self.onincorrect('does not exist');
          }
          return doesExist;
        };
        break;
      case 'gatherDeepChildElements':
        doesExistFunc = function(target) {
          var hasElement = false;
          if (target.element) {
            hasElement = true;
          }
          if (!doesExist) {
            self.onincorrect('does not exist');
          }
          return hasElement;
        };
        break;
      default:
        doesExistFunc = function(target) {
          var doesExist = false;
          if (target.value || target.element) {
            doesExist = true;
          }
          if (!doesExist) {
            self.onincorrect('does not exist');
          }
          return doesExist
        }
        break;
    }

    var testResult = self.gradebook.grade({
      callback: doesExistFunc,
      not: self.gradeOpposite,
      strictness: self.strictness
    });
    self.onresult(testResult);
  });
}


/**
 * Used by the GradeBook to negate the correctness of a test.
 * @param  {Boolean} bool The gradeOpposite param gets set to this. Will default to true if it isn't present or is not specifically false.
 */
TA.prototype.not = function(bool) {
  var self = this;

  if (typeof bool !== 'boolean') {
    bool = true;
  }

  this.queue.add(function() {
    if (bool) {
      self.gradeOpposite = true;
    }
  });
};

/**
 * Check that question values match an expected value. Always uses strict equality.
 * @param  {*} expected - string, number or array of string and numbers.
 */
TA.prototype.equals = function(config) {
  var self = this;
  this.queue.add(function() {
    var expected;
    if (typeof config === 'object' && !(config instanceof Array)) {
      expected = config.expected;
    } else {
      expected = config;
    }

    if (typeof expected !== 'string' && typeof expected !== 'number' && !(expected instanceof Array)) {
      self.onerror('"equals" needs a string, a number, or an array of string and number values.');
      throw new Error();
    }

    if (!(expected instanceof Array)) {
      expected = [expected];
    }

    var equalityFunc = function(target) {
      var isCorrect = false;

      expected.forEach(function(e) {
        if (target.value === e) {
          isCorrect = true;
        }
      });

      if (!isCorrect) {
        self.onincorrect(target.value.toString() + ' is not one of: [' + expected.join(', ') + '].');
      }
      return isCorrect;
    };

    var testResult = self.gradebook.grade({
      callback: equalityFunc,
      not: self.gradeOpposite,
      strictness: self.strictness
    });
    self.onresult(testResult);
  });
}

/**
 * Check that the target value is greater than the given value.
 * @param  {Number} expected - the number for comparison
 * @param  {boolean} orEqualTo - if true, run as >= instead of >
 */
TA.prototype.isGreaterThan = function(config) {
  var self = this;
  this.queue.add(function() {
    var expected = config.expected || config;
    var orEqualTo = config.orEqualTo || false;

    if (typeof expected !== 'number') {
      self.onerror('\'isGreaterThan\' needs a number.');
      throw new Error();
    }

    var greaterThanFunc = function() {};
    switch (orEqualTo) {
      case true:
        greaterThanFunc = function(target) {
          var isGreaterThan = false;
          if (getUnitlessMeasurement(target.value) >= getUnitlessMeasurement(expected)) {
            isGreaterThan = true;
          }
          if (!isGreaterThan) {
            self.onincorrect(target.value + ' is not greater than ' + expected);
          }
          return isGreaterThan;
        }
        break;
      default:
        greaterThanFunc = function(target) {
          var isGreaterThan = false;
          if (getUnitlessMeasurement(target.value) > getUnitlessMeasurement(expected)) {
            isGreaterThan = true;
          }
          if (!isGreaterThan) {
            self.onincorrect(target.value + ' is not greater than ' + expected);
          }
          return isGreaterThan;
        }
        break;
    }

    var testResult = self.gradebook.grade({
      callback: greaterThanFunc,
      not: self.gradeOpposite,
      strictness: self.strictness
    });
    self.onresult(testResult);
  });
}

/**
 * Check that the target value is less than the given value.
 * @param  {Number} expected - the number for comparison
 * @param  {boolean} orEqualTo - if true, run as <= instead of <
 */
TA.prototype.isLessThan = function(config) {
  var self = this;
  this.queue.add(function() {
    var expected = config.expected || config;
    var orEqualTo = config.orEqualTo || false;

    if (typeof expected !== 'number') {
      self.onerror('\'isLessThan\' needs a value.');
      throw new Error();
    }

    var lessThanFunc = function() {};
    switch (orEqualTo) {
      case true:
        lessThanFunc = function(target) {
          var isLessThan = false;
          if (getUnitlessMeasurement(target.value) <= getUnitlessMeasurement(expected)) {
            isLessThan = true;
          }
          if (!isLessThan) {
            self.onincorrect(target.value + ' is not less than ' + expected);
          }
          return isLessThan;
        }
        break;
      default:
        lessThanFunc = function(target) {
          var isLessThan = false;
          if (getUnitlessMeasurement(target.value) < getUnitlessMeasurement(expected)) {
            isLessThan = true;
          }
          if (!isLessThan) {
            self.onincorrect(target.value + ' is not less than ' + expected);
          }
          return isLessThan;
        }
        break;
    }

    var testResult = self.gradebook.grade({
      callback: lessThanFunc,
      not: self.gradeOpposite,
      strictness: self.strictness
    });
    self.onresult(testResult);
  });
};

/**
 * Check that the target value is between upper and lower.
 * @param  {Number} lower - the lower bounds of the comparison
 * @param  {Number} upper - the upper bounds of the comparison
 * @param  {Boolean} lowerInclusive - if true, run lower check as >= instead of >
 * @param  {Boolean} upperInclusive - if true, run upper check as <= instead of <
 */
TA.prototype.isInRange = function(config) {
  // TODO: would be fantastic to use isLessThan and isGreaterThan instead
  var self = this;
  this.queue.add(function() {
    var lower = getUnitlessMeasurement(config.lower);
    var upper = getUnitlessMeasurement(config.upper);
    var lowerInclusive = config.lowerInclusive || true;
    var upperInclusive = config.upperInclusive || true;

    // just in case someone screws up the order
    if (lower > upper) {
      var temp = lower;
      lower = upper;
      upper = temp;
    };

    if (typeof lower !== 'number' || typeof upper !== 'number') {
      self.onerror("'isInRange' needs an upper and a lower value in its config object.");
      throw new Error();
    }

    var xIsLessThan = function() {};
    switch (upperInclusive) {
      case true:
        xIsLessThan = function(target) {
          var isInRange = false;
          if (getUnitlessMeasurement(target.value) <= getUnitlessMeasurement(upper)) {
            isInRange = true;
          }
          if (!isInRange) {
            self.onincorrect(target.value + ' is not less than ' + upper);
          }
          return isInRange;
        }
        break;
      default:
        xIsLessThan = function(target) {
          var isInRange = false;
          if (getUnitlessMeasurement(target.value) < getUnitlessMeasurement(upper)) {
            isInRange = true;
          }
          if (!isInRange) {
            self.onincorrect(target.value + ' is not less than ' + upper);
          }
          return isInRange;
        }
        break;
    }

    var xIsGreaterThan = function() {};
    switch (lowerInclusive) {
      case true:
        xIsGreaterThan = function(target) {
          var isInRange = false;
          if (getUnitlessMeasurement(target.value) >= getUnitlessMeasurement(lower)) {
            isInRange = true;
          }
          if (!isInRange) {
            self.onincorrect(target.value + ' is not greater than ' + lower);
          }
          return isInRange;
        }
        break;
      default:
        xIsGreaterThan = function(target) {
          var isInRange = false;
          if (getUnitlessMeasurement(target.value) > getUnitlessMeasurement(lower)) {
            isInRange = true;
          }
          if (!isInRange) {
            self.onincorrect(target.value + ' is not greater than ' + lower);
          }
          return isInRange;
        }
        break;
    }

    var inRangeFunc = function(target) {
      var isInRange = false;
      if (xIsLessThan(target) && xIsGreaterThan(target)) {
        isInRange = true;
      }
      return isInRange;
    }

    var testResult = self.gradebook.grade({
      callback: inRangeFunc,
      not: self.gradeOpposite,
      strictness: self.strictness
    });
    self.onresult(testResult);
  });
};

/**
 * Check that the value includes at least one of the given expected values.
 * @param  {Array} expectedValues - search for one of the values in the array using regex
 * @param  {Object} config - includes: nValues, minValues, maxValues. Designate the number of values in expectedValues expected to be found in the target value. Defaults to at least one value needs to be found.
 * @return {object} result - the GradeBook's list of questions and overall correctness.
 */
TA.prototype.hasSubstring = function(config) {
  var self = this;
  this.queue.add(function() {
    config = config || '';
    var expectedValues = config.expected;

    // this simplifies JSON syntax
    if (typeof config === 'string' || config instanceof Array) {
      expectedValues = config;
    }

    // make sure expectedValues are an array
    if (!(expectedValues instanceof Array)) {
      expectedValues = [expectedValues];
    };

    var nValues      = config.nValues || false;
    var minValues    = config.minValues || 1;
    var maxValues    = config.maxValues || expectedValues.length;

    if (!expectedValues || expectedValues.length === 0) {
      self.onerror('\'hasSubstring\' needs at least one regex comparison.');
      throw new Error();
    };

    if (typeof minValues !== 'number' || typeof maxValues !== 'number') {
      self.onerror('\'hasSubstring\' \'minValue\' and \'maxValue\' need to be numbers.');
      throw new Error();
    };

    /**
     * Is there a substring in a string? This will answer that question.
     * @param  {object} target - the Target in question
     * @return {boolean} - whether or not expected substring is in target.value
     */
    var substringFunc = function(target) {
      var hasNumberOfValsExpected = false;
      var hits = 0;
      expectedValues.forEach(function(val) {
        var matches = target.value.match(new RegExp(val)) || [];
        if (matches.length > 0) {
          hits += 1;
        } else {
          self.onincorrect(val + ' did not hit against ' + target.value.slice(0, 20));
        }
      });

      if (nValues) {
        (hits === nValues) ? hasNumberOfValsExpected = true : hasNumberOfValsExpected = false;
      } else if (hits >= minValues && hits <= maxValues) {
        hasNumberOfValsExpected = true;
      };

      return hasNumberOfValsExpected;
    };

    var testResult = self.gradebook.grade({
      callback: substringFunc,
      not: self.gradeOpposite,
      strictness: self.strictness
    });
    self.onresult(testResult);
  });
}

// get all the exposed methods so that the translator knows what's acceptable
var taAvailableMethods = Object.getOwnPropertyNames(TA.prototype).filter(function(key) {
  return key.indexOf('_') === -1 && key !== 'constructor';
});

TA.prototype._translateConfigToMethods = function(config) {
  var self = this;
  // return an array of anonymous functions that are closed over this scope.
  var methods = [];

  // so either nodes or elements works in config object
  config['nodes'] = config['nodes'] || config['elements'];

  var definitions = Object.keys(config);

  methods = definitions.map(function(method) {
    return function() {
      try {
        self[method](config[method]);
      } catch (e) {
        self.onerror('Method \'' + method + '\' did not execute. ' + e);
        throw new Error();
      }
    }
  });

  return methods;
};

function ActiveTest(rawTest) {
  // TODO: will need to validate all of these
  this.description = rawTest.description;
  this.flags = rawTest.flags || {};
  this.id = parseInt(Math.random() * 1000000);
  this.testPassed = false;
  this.debugData = [];
  this.incorrectInfo = [];

  this.gradeRunner = function() {};

  // validate the description.
  if (typeof this.description !== 'string') {
    throw new TypeError('Every test needs a description string.');
  }

  // validate the flags
  if (typeof this.flags !== 'object') {
    throw new TypeError('If assigned, flags must be an object.');
  }

  if (typeof rawTest.definition !== 'object') {
    throw new TypeError('Every test needs a definition');
  }

  this.ta = new TA(this.description);

  var self = this;

  // translates json definitions to method calls
  self.queueUp = (function(config) {
    var methodsToQueue = self.ta._translateConfigToMethods(config);
    return function() {
      methodsToQueue.forEach(function(method) {
        try {
          method();
        } catch (e) {
          self.hasErred();
          throw new Error(self.description + ' has an invalid definition.')
        }
      });
    };

  })(rawTest.definition);
};

/**
 * Set off the fireworks! A test passed! Assumes you mean test passed unless didPass is false.
 * @param  {Boolean}  didPass unless didPass === false, method assumes it to be true.
 * @return {Boolean}         [description]
 */
ActiveTest.prototype.hasPassed = function(didPass) {
  var attribute = null;
  if (!didPass) {
    attribute = false;
  } else {
    attribute = true;
    this.testPassed = true;

    if (!this.flags.alwaysRun || this.flags.noRepeat) {
      this.stopTest();
    };
  }
  this.element.setAttribute('test-passed', attribute);
  this.suite.checkTests();
};

ActiveTest.prototype.hasErred = function() {
  this.stopTest();
  this.element.setAttribute('test-passed', 'error')
};

/**
Run a synchronous activeTest every 1000 ms
*/
ActiveTest.prototype.runTest = function() {
  var self = this;

  var noRepeat = this.flags.noRepeat || false; // run only once on load
  var alwaysRun = this.flags.alwaysRun || false; // keep running even if test passes
  var optional = this.flags.optional || false; // test does not affect code display

  var testRunner = function() {
    var promise = new Promise(function(resolve, reject) {
      // clear for every run
      self.debugData = [];
      self.values = [];
      self.incorrectInfo = [];
      // resolve when the test finishes
      self.ta.onresult = function(result) {
        resolve(result);
      };

      self.ta.onerror = function(reason, keepGoing) {
        self.debugData.push(reason);
        if (!keepGoing) {
          self.hasErred();
        }
      };

      self.ta.onincorrect = function(reason) {
        self.incorrectInfo.push(reason);
      }

      // clean out the queue from the last run
      self.ta.queue.clear();

      // this call actually runs the test
      self.queueUp();

    }).then(function(gradedTest) {
      var testCorrect = gradedTest.isCorrect;
      // TODO: nothing is done with the values. Do something?
      var testValues = '';
      gradedTest.questions.forEach(function(val) {
        testValues = testValues + ' ' + val.value;
        self.values.push(testValues);
      });

      self.hasPassed(testCorrect);
    });
  };

  if (noRepeat) {
    testRunner();
  } else {
    testRunner();
    this.gradeRunner = window.setInterval(testRunner, 1000);
  }
};

ActiveTest.prototype.stopTest = function() {
  var self = this;
  clearInterval(self.gradeRunner);
};

function Suite(rawSuite) {
  var name = rawSuite.name;
  var code = rawSuite.code;
  var activeTests = [];
  var id = parseInt(Math.random() * 1000000);

  // validate the name
  if (typeof name !== 'string') {
    throw new TypeError('Every suite needs a name string.');
  }

  // validate the code
  if (typeof code !== 'string') {
    throw new TypeError('Every suite needs a code string.');
  }

  this.name = name;
  this.code = code;
  this.activeTests = [];
  this.id = id;
  this.suitePassed = false; // put a setter on this to emit an event.
};

Object.defineProperties(Suite.prototype, {
  numberOfTests: {
    get: function() {
      return this.activeTests.length || 0;
    }
  },
  numberOfCorrectTests: {
    get: function() {
      var numberCorrect = 0;
      this.activeTests.forEach(function(test) {
        if (test.testPassed) {
          numberCorrect += 1;
        }
      })
      return numberCorrect;
    }
  },
  numberOfCorrectOrOptionalTests: {
    get: function() {
      var numberCorrectOrOptional = 0;
      this.activeTests.forEach(function(test) {
        if (test.optional || test.testPassed) {
          numberCorrectOrOptional += 1;
        }
      })
      return numberCorrectOrOptional;
    }
  },
  numberOfOptionalTests: {
    get: function() {
      var numberOptional = 0;
      this.activeTests.forEach(function(test) {
        if (test.optional) {
          numberOptional += 1;
        }
      })
    }
  },
  allCorrect: {
    get: function() {
      var allGood = false;
      if (this.numberOfTests - this.numberOfCorrectOrOptionalTests <= 0) {
        allGood = true;
      }
      return allGood;
    }
  },
})

Suite.prototype.getDebugData = function() {
  this.activeTests.forEach(function(at) {
    if (at.debugData.length > 0) {
      console.log('%c' + 'ERROR: ' + at.description + ': ' + at.debugData.join(' '), 'color: red;');
    }
  });
}

Suite.prototype.getIncorrectInfo = function() {
  this.activeTests.forEach(function(at) {
    if (at.incorrectInfo.length > 0) {
      console.log('Incorrect: ' + at.description + ': ' + at.incorrectInfo.join('\n'));
    }
  });
}

Suite.prototype.getValues = function() {
  this.activeTests.forEach(function(at) {
    if (at.values.length > 0) {
      console.log('Collected Values: ' + at.description + ': ' + at.values.join('\n'));
    }
  });
}

Suite.prototype.createTest = function(rawTest) {
  var activeTest = new ActiveTest(rawTest);
  activeTest.suite = this;

  function createTestElement(newTest) {
    var activeTestElement = document.createElement('active-test');

    // find the suite element to which the test belongs
    var activeTestsContainer = activeTest.suite.element.shadowRoot.querySelector('.active-tests');
    // attributes get applied to the view
    activeTestElement.setAttribute('description', newTest.description);
    activeTestElement.setAttribute('test-passed', newTest.testPassed);

    // let the Test know which element belongs to it
    activeTest.element = activeTestElement;

    activeTestsContainer.appendChild(activeTestElement);
    return activeTestElement;
  }

  activeTest.element = createTestElement({
    description: activeTest.description,
    passed: activeTest.testPassed,
    definition: activeTest.definition
  });

  this.activeTests.push(activeTest);
  activeTest.runTest();
};

Suite.prototype.checkTests = function() {
  var passed = this.allCorrect;
  this.suitePassed = passed;
  this.element.suitePassed = passed;
  this.element.setAttribute('suite-passed', passed);
  this.element.setAttribute('number-of-tests', this.activeTests.length);
};

/*
  Expose functions that create and monitor tests.
*/

/*
The hotel simply changes the attributes on each web component
 */
var hotel = {
  occupiedSuites: [],
  createSuite: function (rawSuite) {
    var suite = new Suite(rawSuite);

    // pass the whole suite to the testResults so you can modify it there later.
    suite.element = testResults.buildSuiteElement(suite);
    this.occupiedSuites.push(suite);
    return suite;
  }
};

Object.defineProperties(hotel, {
  numberOfPassedSuites: {
    get: function () {
      var numberPassed = 0;
      this.occupiedSuites.forEach(function (suite) {
        if (suite.suitePassed) {
          numberPassed += 1;
        }
      })
      return numberPassed;
    }
  },
  numberOfSuites: {
    get: function () {
      return this.occupiedSuites.length;
    }
  },
  allCorrect: {
    get: function () {
      var allCorrect = false;
      (this.numberOfSuites === this.numberOfPassedSuites) ? allCorrect = true : allCorrect = false;
      // TODO: maybe emit an event if all of them pass?
      return allCorrect;
    }
  }
})

/**
 * Register a suite of tests with the grading engine.
 * @param  {Object} _suite - contains a test's name and code to display upon completion.
 * @return {Function} registerTest - a method to register a single test with the grading engine.
 */
function registerSuite(rawSuite) {
  var self = this;

  var newSuite = hotel.createSuite(rawSuite);

  /**
   * Register a new test on a specific suite. The test will contain an activeTest. Each active test much return a boolean called isCorrect and an array of the targets in question.
   * @param  {Object} _test - contains a description, activeTest and flags.
   * @return {Object} self - for chaining tests registrations together (if you're into that sort of syntax.)
   */
  function registerTest(_test) {
    newSuite.createTest({
      description: _test.description,
      definition: _test.definition,
      flags: _test.flags
    })
    return self;
  }
  return {
    registerTest: registerTest
  }
}

var userData = [];
var isOn = false;

/**
 * For use only when loading a new JSON with user data about the tests they want to run
 * @param  {JSON} suitesJSON Everything the GE needs to know about your tests
 */
function registerSuites(suitesJSON) {
  try {
    if (suitesJSON.length > 0) {
      userData = JSON.parse(suitesJSON);
    }
  } catch (e) {
    console.log(e);
    throw new Error('Invalid JSON format.');
  }
  if (userData instanceof Array !== true) {
    throw new TypeError('Invalid test format. Tests must be wrapped in an array.');
  }
  if (isOn) {
    startTests();
  }
};

function startTests() {
  userData.forEach(function (_suite) {
    var newSuite = registerSuite({
      name: _suite.name,
      code: _suite.code
    });

    _suite.tests.forEach(function (test) {
      newSuite.registerTest({
        description: test.description,
        definition: test.definition,
        flags: test.flags
      });
    });
  });
};

function turnOn() {
  if (!isOn) {
    testWidget.buildWidget();
    isOn = true;
    startTests();
  }
};

function turnOff () {
  hotel.occupiedSuites.forEach(function (suite) {
    suite.activeTests.forEach(function (activeTest) {
      activeTest.stopTest();
    });
  });
  hotel.occupiedSuites = [];
  testWidget.killWidget();
  isOn = false;
};

function debug() {
  hotel.occupiedSuites.forEach(function (suite) {
    suite.getDebugData();
    suite.getIncorrectInfo();
    suite.getValues();
  });
};

exports.debug = debug;
exports.turnOn = turnOn;
exports.turnOff = turnOff;
exports.registerSuites = registerSuites;

/* jshint ignore:start */
return exports;
}(window));
window.dispatchEvent(new CustomEvent('GE-on', {detail: true}));
/* jshint ignore:end */
