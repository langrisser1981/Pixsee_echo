import {HandlerInput,RequestHandler} from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';

const WelcomeIntentHandler= {
    
    canHandle(handlerInput){
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest' 
    },
    
    //handle function is modified to async/await structure to
    //call async funtions in handler
    async handle(handlerInput){
        //asynchronous function to handle request
        const response = await sayWelcome(handlerInput)
        return response;
    },
};

//This function will call third party api and returns response to handler      
const sayWelcome = async (handlerInput) => {
    
    //async function to get latlongs from address/city name.
    const location=await getLatLongFromAddress('Pune')
    
    //Create Skill response
    const speechText = `Hey! Altaf here. Welcome to my Alexa bot. Just to let you know, Lattitude for Pune is ${location.lat} and Longitude is ${location.lng}.`;
    const res = await handlerInput.responseBuilder
        .speak(speechText)
        .withSimpleCard(`Welcome`, speechText)
        .getResponse();
    return res
}

export default WelcomeIntentHandler;