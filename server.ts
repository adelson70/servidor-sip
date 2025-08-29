import dgram, { RemoteInfo, Socket } from "dgram";
import { processSipMessage } from "./sip-messages/process-sip-message";

const server: Socket = dgram.createSocket("udp4");
const PORT = 5060;
const HOST = "0.0.0.0";

export const sendMessage = (message: string, rinfo: RemoteInfo, socke: Socket = server) => {
    const msgBuffer = Buffer.from(message);
    socke.send(msgBuffer, rinfo.port, rinfo.address, (err) => {
        if (err) {
            console.error(`Erro ao enviar mensagem:\n${err.stack}`);
        }
    });
};

server.on("error", (err: Error) => {
    console.error(`Erro no servidor:\n${err.stack}`);
    server.close();
});

server.on("message", (msg: Buffer, rinfo: RemoteInfo) => {
    // msg é um Buffer, rinfo contém o endereço e porta do remetente
    // console.log(`\n--- Mensagem Recebida de ${rinfo.address}:${rinfo.port} ---`);
    // console.log(msg.toString());

    // AQUI ENTRARÁ NOSSA LÓGICA
    processSipMessage(msg, rinfo);
});

server.on("listening", () => {
    const address = server.address();
    console.log(`Servidor SIP ouvindo em ${address.address}:${address.port}`);
});

server.bind(PORT, HOST);
