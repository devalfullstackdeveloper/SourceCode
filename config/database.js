'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use('Helpers')

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Default Connection
  |--------------------------------------------------------------------------
  |
  | Connection defines the default connection settings to be used while
  | interacting with SQL databases.
  |
  */
  connection: Env.get('DB_CONNECTION', 'mysql'),

  /*
  |--------------------------------------------------------------------------
  | Sqlite
  |--------------------------------------------------------------------------
  |
  | Sqlite is a flat file database and can be good choice under development
  | environment.
  |
  | npm i --save sqlite3
  |
  */
  sqlite: {
    client: 'sqlite3',
    connection: {
      filename: Helpers.databasePath(`${Env.get('DB_DATABASE', 'development')}.sqlite`)
    },
    useNullAsDefault: true
  },

  /*
  |--------------------------------------------------------------------------
  | MySQL
  |--------------------------------------------------------------------------
  |
  | Here we define connection settings for MySQL database.
  |
  | npm i --save mysql
  |
  */
  mysql: {
    client: 'mysql',
    connection: {
      host: Env.get('DB_HOST', '178.128.119.55'),
      port: Env.get('DB_PORT', '3306'),
      //localhost
      user: Env.get('DB_USER', 'root'),
      password: Env.get('DB_PASSWORD', '@cryptoFx2019_db'),
      database: Env.get('DB_DATABASE', 'CryptoFxSpaceDb'),
      //design
      // user: Env.get('DB_USER', 'zithex19_design'),
      // password: Env.get('DB_PASSWORD', 'Zithex@2019'),
      // database: Env.get('DB_DATABASE', 'zithex19_design'),
       //dev
      //  user: Env.get('DB_USER', 'zithex19_dev'),
      //  password: Env.get('DB_PASSWORD', 'Zithex@2019'),
      //  database: Env.get('DB_DATABASE', 'zithex19_dev'),
      //production
      // user: Env.get('DB_USER', 'root'),
      // password: Env.get('DB_PASSWORD', 'administrator'),
      // database: Env.get('DB_DATABASE', 'zithex_prod'),
      
      prefix: 'zx_'
    }
  },

  /*
  |--------------------------------------------------------------------------
  | PostgreSQL
  |--------------------------------------------------------------------------
  |
  | Here we define connection settings for PostgreSQL database.
  |
  | npm i --save pg
  |
  */
  pg: {
    client: 'pg',
    connection: {
      host: Env.get('DB_HOST', 'localhost'),
      port: Env.get('DB_PORT', ''),
      user: Env.get('DB_USER', 'root'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis')
    }
  }
}
