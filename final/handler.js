"use strict";
const AWS = require("aws-sdk");
module.exports = {
  main: async function (event, context) {

      if(event.extensions.request.headers['ce-type']){
          console.log(`Cloud event arrived from ${event.extensions.request.headers['origin']}`);
          console.log(`event source : ${event.extensions.request.headers['ce-source']}`);
          console.log(`event type : ${event.extensions.request.headers['ce-type']}`);
      }
      
      let s3 = new AWS.S3({
        endpoint: readEnv("S3_ENDPOINT"),
        accessKeyId: readEnv("S3_ACCESSKEY_ID"),
        secretAccessKey: readEnv("S3_SECRET"),
      });

      let body = JSON.stringify(event.data);

      let params = {
        Bucket: readEnv("S3_BUCKET"),
        Key: Date.now().toString(),
        Body: body,
      };
    try {
      console.log(`Pushing ${body} to S3`)  
      return await s3.upload(params).promise();
    } catch (e) {
      console.log(e);
      return e;
    }
  },
};

function readEnv(env = "") {
    if(process.env[env]){
        console.log(`Reading ENV [${env}]`)  
        return process.env[env];      
    } else {
        throw new Error (`Missing required env [${env}]`);
    }
}