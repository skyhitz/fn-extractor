var compile, esprima, getFunctions, parse, traverse, vm;

esprima = require('esprima');

vm = require('vm-browserify');

traverse = function(object, visitor, master) {
  var parent;
  parent = master === 'undefined' ? [] : master;
  if (visitor.call(null, object, parent) === false) {
    return;
  }
  return Object.keys(object).forEach(function(key) {
    var child, path;
    child = object[key];
    path = [object];
    path.push(parent);
    if (typeof child === 'object' && child !== null) {
      return traverse(child, visitor, path);
    }
  });
};

getFunctions = function(tree, code) {
  var list;
  list = [];
  traverse(tree, function(node, path) {
    var parent;
    if (node.type === 'FunctionDeclaration') {
      return list.push({
        name: node.id.name,
        params: node.params,
        range: node.range,
        blockStart: node.body.range[0],
        end: node.body.range[1]
      });
    } else if (node.type === 'FunctionExpression') {
      parent = path[0];
      if (parent.type === 'AssignmentExpression') {
        if (typeof parent.left.range !== 'undefined') {
          return list.push({
            name: code.slice(parent.left.range[0], parent.left.range[1] + 1),
            params: node.params,
            range: node.range,
            blockStart: node.body.range[0],
            end: node.body.range[1]
          });
        }
      } else if (parent.type === 'VariableDeclarator') {
        return list.push({
          name: parent.id.name,
          params: node.params,
          range: node.range,
          blockStart: node.body.range[0],
          end: node.body.range[1]
        });
      } else if (parent.type === 'CallExpression') {
        return list.push({
          name: parent.id ? parent.id.name : '[Anonymous]',
          params: node.params,
          range: node.range,
          blockStart: node.body.range[0],
          end: node.body.range[1]
        });
      } else if (typeof parent.length === 'number') {
        return list.push({
          name: parent.id ? parent.id.name : '[Anonymous]',
          params: node.params,
          range: node.range,
          blockStart: node.body.range[0],
          end: node.body.range[1]
        });
      } else if (typeof parent.key !== 'undefined') {
        if (parent.key.type === 'Identifier') {
          if (parent.value === node && parent.key.name) {
            return list.push({
              name: parent.key.name,
              params: node.params,
              range: node.range,
              blockStart: node.body.range[0],
              end: node.body.range[1]
            });
          }
        }
      }
    }
  });
  return list;
};

compile = function(name, node, code) {
  var args, context, wrapped;
  args = [];
  context = {};
  node.params.forEach(function(param) {
    return args.push(param.name);
  });
  name = name.replace(/\W/g, '');
  wrapped = "function " + name + "(" + (args.join(',')) + ") {\n " + (code.slice(node.blockStart + 1, node.end)) + "\n}";
  vm.runInNewContext(wrapped, context);
  return context[name];
};

module.exports = parse = function(code) {
  var exported, functions, tree;
  tree = esprima.parse(code, {
    loc: true,
    range: true
  });
  functions = getFunctions(tree, code);
  exported = {};
  functions.filter(function(fn) {
    return fn.name !== '[Anonymous]';
  }).forEach(function(fn) {
    return exported[fn.name] = compile(fn.name, fn, code);
  });
  return exported;
};
