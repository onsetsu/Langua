function flattenIterNodes(nodes) {
  var result = [];
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i]._node.ctorName === '_iter') {
      result.push.apply(result, flattenIterNodes(nodes[i].children));
    } else {
      result.push(nodes[i]);
    }
  }
  return result;
}

function compareByInterval(node, otherNode) {
  return node.source.startIdx - otherNode.source.startIdx;
}

function nodeToOp(node, children, op) {
  var flatChildren = flattenIterNodes(children).sort(compareByInterval);

  // Keeps track of where the previous sibling ended, so that we can re-insert discarded
  // whitespace into the final output.
  var prevEndIdx = node.source.startIdx;

  var code = '';
  for (var i = 0; i < flatChildren.length; ++i) {
    var child = flatChildren[i];

    // Restore any discarded whitespace between this node and the previous one.
    if (child.source.startIdx > prevEndIdx) {
      code += node.source.sourceString.slice(prevEndIdx, child.source.startIdx);
    }
    // code += child.toES5();
    code += op(child);
    prevEndIdx = child.source.endIdx;
  }
  return code;
}

module.exports = nodeToOp;