//Servicio: cliente (postman) => servidor (post) => base de datos (mongodb)

//Conexión con la base de datos

const MongoClient = require ('mongodb').MongoClient;            //importar el cliente de mongodb

const dburl = 'mongodb://localhost:27017';  //especificar la url de conexión por defecto al servidor local

const dbName = 'nodejs-mongo';            //nombre de la base de datos a la que conectarse

const dbclient = new MongoClient (dburl, {useNewUrlParser : true});   //crear una instancia del cliente de mongodb


const http = require ('http');                //requerir el interfaz http

const querystring = require ('querystring');  //importar el módulo querystring

const httpport = 3000;                            //definir el puerto a utilizar



//Crear el servidor

//crear el servidor y definir la respuesta que se le da a las peticiones
const server = http.createServer ((request,response) =>{    

    //extraer el contenido de la petición (datos recibidos-request)
    const {headers, method, url} = request;

    //obtener los argumentos de la url
    const path = url.split("?")[0];                       //separar a partir de ?
    const args = querystring.decode(url.substring(path.length+1,url.length),"&");  //almacena la parte final de la url
                                                                                  //decodificar esa subcadena de la url
    console.log ('headers:', headers);
    console.log ('method:', method);
    console.log ('url:', url);
    console.log (method,"/",path);
    console.log (args);

    //crear variable para concatenar info que se recibe con el evento data
    let body =[];
    
    //eventos asociados a la petición
    request.on ('error',(err) =>{       //emite evento para controlar errores
        console.error(err);
    }) .on ('data', (chunk) =>{        //evento data   
        body.push (chunk);             //el cuerpo de la petición puede venir en partes y aquí se concatenan
    }) .on ('end', () =>{              //al emitirse este evento, el contenido estará completo en la variable body
        body = Buffer.concat(body).toString();
    });
        console.log('body:', body);


    //Acciones del servidor : crear y listar

    if (method == 'POST' && path == '/') {

        dbclient.connect().then (async() =>{                      //conectar el cliente al servidor

            console.log ("Conectando con éxito al servidor");

            const db = dbclient.db(dbName);
        
            const collection = db.collection('usuarios');      //obtener la referencia a la colección

            

            const insertResult = await collection.insertOne(args);    //llamar a la función para insertar

            console.log ("Resultado de la consulta:", insertResult.result);
            
            
            const findResult = await collection.find().toArray();  //llamar a la función para recuperar

            console.log("Documentos recuperados:",findResult);

            //Contenido respuesta

            response.statusCode = 200;         //código de estado http que se devuelve

            response.setHeader ('Content-Type','text/html');//encabezados de la respuesta, texto html

            response.write ('<html><body>');

            response.write ('<h4>Nombres y teléfonos almacenados</h4>')

            for (let i=0; i<findResult.length; i++){
                response.write('<li>'+ findResult[i]["name"] + " : " + findResult[i]["phone"] + '</li>')
            }

            response.write ('</body></html>');

            response.end();
        
        }).catch ((error) => {
            console.log ("Se produjo algún error operando con la base de datos:" + error);
            dbclient.close();

            response.setHeader('Content-Type','text/plain');
            response.write("Internal Server Error");
            response.statusCode = 500;
            response.end;
         });


    } else {
        response.statusCode = 404;
        response.setHeader('Content-Type','text/plain');
        response.write("Not found");
        response.end();
    }

})

//ejecutar el servicio para que permanezca a la espera de peticiones
server.listen(httpport,() =>{
    console.log ('servidor ejecutándose...');
    console.log ('abrir en un navegador http://localhost:3000');
});

