import {createHmac,timingSafeEqual,randomBytes} from "node:crypto";
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
export default async (req)=>{
 if(req.method!=="POST")return reply({error:"Método não permitido."},405);
 const password=process.env.PAINEL_SENHA,secret=process.env.PAINEL_TOKEN_SECRET;
 if(!password||!secret||secret.length<32)return reply({error:"Configure PAINEL_SENHA e PAINEL_TOKEN_SECRET (mínimo 32 caracteres) no Netlify."},503);
 let supplied="";try{const body=await req.json();supplied=typeof body.password==="string"?body.password:"";}catch{return reply({error:"Solicitação inválida."},400);}
 const a=createHmac("sha256",secret).update(supplied).digest(),b=createHmac("sha256",secret).update(password).digest();
 if(!timingSafeEqual(a,b))return reply({error:"Senha incorreta."},401);
 const payload=Buffer.from(JSON.stringify({exp:Date.now()+8*60*60*1000,nonce:randomBytes(16).toString("hex")})).toString("base64url");
 const signature=createHmac("sha256",secret).update(payload).digest("base64url");
 return reply({token:payload+"."+signature});
};
