/*
    This is not secure!
    This is only for demo purposes.
    Storing access tokens in a secure database and retrieved from a backend server is ideal. 

    [insert link to docs]
*/
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// import { JsonDB, Config } from 'node-json-db';
// var db = new JsonDB(new Config("database.json", true, false, '/'));

interface Customer {
    customer_id: string,
    connections: Connection[],
}

interface Connection {
    //connection_id: string, // can use if using relational database
    company_id: string,
    account_id: string,
    provider_id: string,
    access_token: string,
}

interface connection_old {
    current_connection: string
}

const schema = {
    customers: [
        {
            customer_id: 123,
            connections: [
                "1",
                "2"
            ]
        }
    ],
    connections: {
        "1": {
            company_id: '',
            account_id: '',
            provider_id: '',
            access_token: '',
        },
        "2": {
            connection_id: '2',
            company_id: '',
            account_id: '',
            provider_id: '',
            access_token: '',
        },
    }
}

var database = {
    setConnectionByCustomer: function (customer_id: string, connection: Connection) {

    },
    getTokenByCompany: async function (customer_id: string, connection: Connection) {

    },

}

export default database
