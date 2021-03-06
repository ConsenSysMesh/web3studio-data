const doWhilst = require('p-do-whilst');
const _ = require('lodash');

require('dotenv').config();

const graphql = require('@octokit/graphql').defaults({
  headers: {
    authorization: `bearer ${process.env.GITHUB_TOKEN}`
  }
});

/**
 * Performs a graphql query and pages through all results
 *
 * @param {Object} ops - options
 * @param {string} ops.query - GraphQL Query
 * @param {Function} ops.selector - A function to select the salient node to page
 * @param {Object} ops.variables - Variables for the query
 * @returns {Promise<Array>} Results of the query
 */
const queryAll = async ({ query, selector, variables = {} }) => {
  let currentCursor = variables.cursor || null;
  let data = [];

  await doWhilst(
    async () => {
      const result = await graphql(query, {
        ...variables,
        cursor: currentCursor
      });

      const selected = selector(result);

      data = data.concat(selected.edges);

      currentCursor = _.get(selected, 'pageInfo.hasNextPage', false)
        ? selected.pageInfo.endCursor
        : null;
    },
    () => currentCursor !== null
  );

  return data;
};

module.exports = {
  queryAll
};
