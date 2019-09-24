// Aplicacao simplificada (monolitica) para acessar esquema rm no banco Oracle

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var oracledb = require('oracledb');

var app = express();
app.use(bodyParser.json());

var port = 3000;

oracledb.outFormat = oracledb.OBJECT;

// HTTP Method: GET
// URI        : /coligadas
// Lista todas as coligadas
app.get('/coligadas', function (req, res) {
  doGetConnection(res, function(err, connection) {
    if (err)
      return;
      connection.execute(
      "select codcoligada, nomefantasia from gcoligada where codcoligada <> 0",
      function (err, result) {
        if (err) {
          res.set('Content-Type', 'application/json');
          res.status(500).send(JSON.stringify({
            status: 500,
            message: "Erro ao consultar coligadas",
            detailed_message: err.message
          }));
        } else {
          res.contentType('application/json').status(200);
          res.send(JSON.stringify(result.rows));
        }
        doRelease(connection, "GET /coligadas");
      });
  });
});

// HTTP method: GET
// URI        : /secoes/COLIGADA
// Lista secoes de uma coligada
app.get('/secoes/:coligada', function (req, res) {
  doGetConnection(res, function(err, connection) {
    if (err)
      return;
      connection.execute(
      "SELECT codigo, descricao FROM psecao WHERE codcoligada = :f",
      { f: req.params.coligada },
      function (err, result) {
        if (err) {
          res.set('Content-Type', 'application/json');
          res.status(500).send(JSON.stringify({
            status: 500,
            message: "Erro ao consultar a secão",
            detailed_message: err.message
          }));
        } else if (result.rows.length < 1) {
          res.set('Content-Type', 'application/json');
          res.status(404).send(JSON.stringify({
            status: 404,
            message: "Não foram encontradas seções para a coligada informada",
            detailed_message: ""
          }));
        } else {
          res.contentType('application/json');
          res.status(200).send(JSON.stringify(result.rows));
        }
        doRelease(connection, "GET /secoes/" + req.params.coligada);
      });
  });
});

// HTTP method: GET
// URI        : /funcionario/COLIGADA/MATRICULA
// Lista dados de um funcionario de uma determinada coligada
app.get('/funcionario/:coligada/:matricula', function (req, res) {
    doGetConnection(res, function(err, connection) {
      if (err)
        return;
        connection.execute(
        `    SELECT a.chapa, a.codsecao, b.descricao area, a.nome, a.codfuncao, c.descricao funcao 
               FROM pfunc a 
         INNER JOIN psecao b on a.codcoligada=b.codcoligada and a.codsecao=b.codigo 
         INNER JOIN pfuncao c on c.codcoligada=a.codcoligada and a.codfuncao=c.codigo
              WHERE a.codcoligada = :f1 AND a.chapa = :f2
        `,
        {   f1: req.params.coligada
          , f2: req.params.funcionario
        },
        function (err, result) {
          if (err) {
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
              status: 500,
              message: "Erro ao consultar a funcionario",
              detailed_message: err.message
            }));
          } else if (result.rows.length < 1) {
            res.set('Content-Type', 'application/json');
            res.status(404).send(JSON.stringify({
              status: 404,
              message: "Funcionário não encontrado",
              detailed_message: ""
            }));
          } else {
            res.contentType('application/json');
            res.status(200).send(JSON.stringify(result.rows));
          }
          doRelease(connection, "GET /secoes/" + req.params.coligada);
        });
    });
  });

// Usa uma conexao do Pool de conexoes
function doGetConnection(res, cb) {
  oracledb.getConnection(function (err, connection) {
    if (err) {
      res.set('Content-Type', 'application/json');
      res.status(500).send(JSON.stringify({
        status: 500,
        message: "Erro conectando ao banco de dados",
        detailed_message: err.message
      }));
    } else {
      cb(err, connection);
    }
  });
}

// Libera uma conexao para o Pool de conexoes
function doRelease(connection, message) {
  connection.close(
    function(err) {
      if (err)
        console.error(err);
      else
        console.log(message + " : conexao liberada");
    });
}

function run() {
  oracledb.createPool({
      user: process.env.NODE_ORACLEDB_USER,
      password: process.env.NODE_ORACLEDB_PASSWORD,
      connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING
    },
    function(err) {
      if (err)
        console.error("createPool() error: " + err.message);
      else
        var server = app.listen(port,
          function () {
            console.log('Servidor esta escutando na porta ' + server.address().port);
          });
    });
}


process
  .on('SIGTERM', function() {
    console.log("\nTerminating");
    process.exit(0);
  })
  .on('SIGINT', function() {
    console.log("\nTerminating");
    process.exit(0);
  });

run();
