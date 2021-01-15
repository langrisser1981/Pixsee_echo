const Alexa = require('ask-sdk')
const axios = require('axios')
const qs = require('qs')

module.exports = async function (context, req) {
    context.log("alexa");

    let mail = 'lizette.chiang@gmail.com';
    let pw = '@Aa123456';
    let token;
    let openId, babyId, deviceId, uid;
    let imageType = 2;

    const pixsee = axios.create({
        baseURL: 'https://staging.ipg-services.com/api/v1',
        headers: {
            'Content-Type': 'application/json',
            },
        });

    const pixseeAuthorization = async (_mail, _pw) => {
        try{
            let data = {
                'account':_mail,
                "password":_pw
            }
            let res = await pixsee.post('/authorization/login', data)
            const code = res.data.result.code
            context.log("code: ", code)

            data = {
                'code': code,
                'grant_type': 'authorization_code'
            }

            context.log("data: ", data)
            res = await pixsee.post('/authorization/authorize', data, { 
                headers: {
                    'Authorization': 'Basic WTJVMU1HWmlOVFl0WkRGaE5DMDBaVFUwTFdJeVpqZ3RZVEZpTXpJMVlXVmpZakZtOk1XTmlNR1V4TVdJdFpqTmlZeTAwWlRFekxXSmpZbVF0TlRSaVpXWTJPVFJtTVdNMw==', 
                    'Content-Type': 'application/json',
                }
            })

            token = `Bearer ${res.data.access_token}`;
            pixsee.defaults.headers['Authorization'] = token;
            context.log("token: ", token);
        }catch (error){
            context.log("error: ", error)
        }
    };

    const pixseeAccount = async () => {
        try{
            let res = await pixsee.get('/accounts/limit_info');
            openId = res.data.result.openId;
            context.log("user: ", openId);

            res = await pixsee.get(`/babies?openid=${openId}`)
            babyId = res.data.result[0].babyId;
            context.log("baby: ", babyId);

            res = await pixsee.get(`/devices?babyid=${babyId}`)
            deviceId = res.data.result[0].deviceId;
            uid = res.data.result[0].uid;
            context.log("uid: ", uid);
        }catch (error){
            context.log("error: ", error)
        }
    };

    const pixseeStorage = async () => {
        try{
            let current = Math.floor( Date.now()/1000) - (1000*60*60*24);
            context.log("current: ", current);
            let res = await pixsee.get(`/storages/s/${babyId}?sdt=${current}`);
            data = res.data.result.data;
            let fid = null
            if (data.length > 0){
                fid = data[0].fid
            }
            context.log("data: ", data[0]);

            let imageUrl = `${pixsee.defaults.baseURL}/storages/o/${fid}?type=${imageType}`

            res = await pixsee.get(imageUrl, {
                responseType: 'arraybuffer'
              });
            let imageData = Buffer.from(res.data, 'base64')
            return {imageUrl, imageData}
        }catch (error){
            context.log("error: ", error)
        }
    };

    await pixseeAuthorization(mail, pw);
    await pixseeAccount();
    let {imageUrl, imageData} = await pixseeStorage();
    context.log("url: ", imageUrl);

    const LaunchRequestHandler = {
        canHandle(handlerInput){
            return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
        },
        handle(handlerInput){
            const speechText = "welcome to pixsee, yuo can say play camera"
            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(speechText)
                .withSimpleCard('Hello Pixsee', speechText)
                .getResponse()
        }
    };

    const HelloWorldIntentHandler = {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
        },
        handle(handlerInput) {
            console.log(code);

            const speechText = 'this is pixsee camera, stream address is rtsp://localhost:433'+code;
            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard('Hello World', speechText)
            .getResponse();
        }
    };

    const HelpIntentHandler = {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
        },
        handle(handlerInput) {
            const speechText = 'You can say hello to me!';
            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(speechText)
                .withSimpleCard('Hello World', speechText)
                .getResponse();
        }
    };

    const CancelAndStopIntentHandler = {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'IntentRequest' && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
        },
        handle(handlerInput) {
            const speechText = 'Goodbye!';
            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard('Hello World', speechText)
                .withShouldEndSession(true)
                .getResponse();
        }
    };

    const SessionEndedRequestHandler = {
        canHandle(handlerInput) {
            return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
        },
        handle(handlerInput) {
            //any cleanup logic goes here
            return handlerInput.responseBuilder.getResponse();
        }
    };

    const ErrorHandler = {
        canHandle() {
            return true;
        },
        handle(handlerInput, error) {
            console.log(`Error handled: ${error.message}`);
            return handlerInput.responseBuilder
                .speak('Sorry, I can\'t understand the command. Please say again.')
                .reprompt('Sorry, I can\'t understand the command. Please say again.')
                .getResponse();
        },
    };

    const response = imageData
    //const skillBuilder = Alexa.SkillBuilders.custom()
        //.addRequestHandlers(
            //LaunchRequestHandler,
            //HelloWorldIntentHandler,
            //HelpIntentHandler,
            //CancelAndStopIntentHandler,
            //SessionEndedRequestHandler,
            ////WelcomeIntentHandler,
            ////CustomEchoIntentHandler,
            ////AnotherIntentHandler
            //)
        //.addErrorHandlers(ErrorHandler)
    
    //const skill = skillBuilder.create();
    //const response = await skill.invoke(req.body);
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'image/jpeg',
        },
        body: response
    };
};