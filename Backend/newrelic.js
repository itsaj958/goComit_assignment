// New Relic agent configuration
// See: https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration

'use strict';

/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   * Default: 'Anuj2' (from NEW_RELIC_APP_NAME env var)
   */
  app_name: [process.env.NEW_RELIC_APP_NAME || 'GoComet DAW'],

  /**
   * Your New Relic license key.
   * Required: 7224a8ee0d182f2dcc1cee0eadfa43aeFFFFNRAL
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',

  /**
   * Logging level
   * Options: 'error', 'warn', 'info', 'debug', 'trace'
   */
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  },

  /**
   * This setting controls distributed tracing.
   * Distributed tracing lets you see the path that a request takes through your
   * distributed system. Enabling distributed tracing changes the behavior of some
   * New Relic features, so carefully consult the transition guide before you enable
   * this feature: https://docs.newrelic.com/docs/transition-guide-distributed-tracing
   */
  distributed_tracing: {
    /**
     * Enables/disables distributed tracing.
     *
     * @env NEW_RELIC_DISTRIBUTED_TRACING_ENABLED
     */
    enabled: true
  },

  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,

  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end, and ? as wildcard for one character.
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },

  /**
   * Enables transaction traces
   */
  transaction_tracer: {
    enabled: true,
    record_sql: 'obfuscated',
    explain_threshold: 500 // milliseconds - log slow queries
  },

  /**
   * Enables error collection
   */
  error_collector: {
    enabled: true,
    capture_events: true
  },

  /**
   * Application logging configuration
   */
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true
    }
  }
};

