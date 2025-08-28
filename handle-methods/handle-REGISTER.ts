import { SipMessage } from "../types";

export const handleRegister = async (message: SipMessage) => {
    let response: string;
    console.log("📋 Handling REGISTER:", message);
    response = `SIP/2.0 200 OK`;
    
    // VERIFICA SE TEM AUTORIZATION SE N ENVIA O DESAFIO
    if (!message.headers["Authorization"]) {
        // Envia o desafio
    }

    return response
};
