import { IpcMainInvokeEvent } from "electron";
import { request } from "https";

export async function translate(event: IpcMainInvokeEvent, url: string) {
    return new Promise<{ status: number; data: string }>((resolve) => {
        const req = request(new URL(url), { method: "GET" }, (res) => {
            let data = "";
            
            res.on("data", (chunk) => {
                data += chunk;
            });
            
            res.on("end", () => {
                resolve({
                    status: res.statusCode || -1,
                    data: data
                });
            });
        });
        
        req.on("error", (error) => {
            resolve({
                status: -1,
                data: error.message
            });
        });
        
        req.end();
    });
}
