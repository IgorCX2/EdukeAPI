const { Op, DATE } = require("sequelize");
const UserConfig = require('../models/UserConfig')
const express = require("express");
var jwt = require('jsonwebtoken');
const router = express.Router();
const cors = require('cors');
const { rateLimit } = require("express-rate-limit");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs/dist/bcrypt");
router.use(express.urlencoded({ extended: true}))
router.use(express.json());
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
    res.header("x-forwarded-for", "*")
    router.use(cors());
    next();
});
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "edukecx2@gmail.com",
      pass: "ovymmnxoprslxmfv",
    },
    tls: {
      rejectUnauthorized: false,
    },
});

async function EnviarEmail(email, usuario, cod, tipo) {
    const text = ['Seja bem vindo a plataforma EdukeCX2, será um prazer ter você conosco em nossa plataforma.Mas antes, você deve finalizar o seu cadastro, validando o seu email clicando no botão abaixo =)','Ficamos sabendo que você perdeu/esqueceu a senha de nossa plataforma =( Não fique triste, eu mesmo vivo esquecendo as senhas, isso é normal =).Para resolvemos este problema é simples, basta clicar no botão abaixo, e colocar a sua nova senha! Viu como é fácil?', `${cod.split('&')[2]}.Você acaba de receber o número de validação de login, agora é só digitar este número no campo de validação`]
    const assunto = ['Verificação de Usuário','Recuperação de senha', 'Validar Login']
    const mailSent = await transporter.sendMail({
      text: text[tipo],
      subject: assunto[tipo],
      from: "Equipe CX2 <edukecx2@gmail.com",
      to: email,
      html: `
      <html>
        <body style="background-color: #F5F5F5; padding: 20px;">
            <table width="600" border="0" cellpadding="1px" cellspacing="0" align="center" style="background-color: #FFFFFF; border-radius: 10px; padding: 10px 50px 20px 50px; margin-top: 50px;">
                <tr>
                    <th><img style="margin-top: -50px; margin-bottom: 20px;" height="100px" src="https://cdn.discordapp.com/attachments/572825603942645762/1046477794756001842/logo.png"><th>
                </tr>
                <tr>
                    <th style="font-size: 30px; font-weight: normal;">Olá, <strong>${usuario}</strong><th>
                </tr>
                <tr style="">
                    <th style="${tipo == 2 ? "letter-spacing: 10px; font-size: 32px; text-align: center; color:#3B82F6; text-transform: uppercase;" : "font-size: 18px; text-align: left;"}  font-weight: normal; padding-top: 40px; ">${text[tipo].split('.')[0]}<th>
                </tr>
                <tr>
                    <th style="font-size: 18px; font-weight: normal; padding-top: 30px; padding-bottom: 40px; text-align: left;">${text[tipo].split('.')[1]}<th>
                </tr>
                <tr style="${tipo == 2 ? "display:none" : ""}">
                    <th><a href="http://localhost:3000/conta/${tipo == "1" ? "recuperar" : "validar"}/${cod}" style="text-decoration: none; color: #FFFFFF; background-color: #3B82F6; padding: 10px 40px 10px 40px; border-radius: 10px;">${tipo == "1" ? "TROCAR SENHA":"VALIDAR EMAIL"}</a><th>
                </tr>
                <tr style="${tipo == 2 ? "display:none" : ""}">
                    <th style="padding-top: 20px"><a href="http://localhost:3000/conta/${tipo == "1" ? "recuperar" : "validar"}/${cod}" style="text-decoration: none; text-align: center; ">http://localhost:3000/conta/${tipo == "1" ? "recuperar" : "validar"}/${cod}</a><th>
                </tr>
                <tr>
                    <th style="padding-top: 40px; font-weight: normal">${tipo == "1" ? "caso você não solicitou a troca de senha, recomendamos que mude a sua senha imediatamente" : "caso não seja você ignore esta mensagem"}<th>
                </tr>
            </table>
        </body>
      </html>
      `,
    });
}
function Codigo(tipo, user){
    var stringCodigo = `${tipo}&${user}&`;
    const tamanhos = [8,6,6]
    var caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(var i = 0; i < tamanhos[Number(tipo)-1]; i++){
      stringCodigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return(stringCodigo)
}
const AccountLimiter = rateLimit({
	windowMs: 60 * 30 * 1000,
	max: 10,
	message: { msg: `Você Tentou realizar está ação muitas vezes, Aguarde alguns minutos e tente novamente`, status: '92429F'},
	standardHeaders: false,
	legacyHeaders: false,
})
router.post('/add-user', AccountLimiter, async (req, res) => {
    const validate = await UserConfig.findOne({
        where: {
            [Op.or]: [
                { email: req.body.form.email},
                { nick: req.body.form.nick }
            ]
        }
    });
    if(!validate){
        req.body.form.senha = await bcrypt.hash(req.body.form.senha, 8);
        req.body.form.stats = await Codigo(1, Number((await UserConfig.count()).toString())+1)
        req.body.form.endereco = await req.ip
        await UserConfig.create(req.body.form)
        await EnviarEmail(req.body.form.email, req.body.form.nick, req.body.form.stats, 0)
        return res.json({
            status: '1',
            msg: `parabéns você foi cadastrado em nossa plataforma com sucesso`,
        });
    }
    return res.json({
        status: `${validate.email == req.body.form.email ? '09411F' : '07024F'}`,
        msg: `erro, o ${validate.email == req.body.form.email ? 'email' : 'nome de usuário'} já cadastrado`,
    });
});
router.post('/login-user', AccountLimiter, async (req, res) => {
    const validate = await UserConfig.findOne({
        where: {
            [Op.or]: [
                {email: req.body.form.usuario},
                {nick: req.body.form.usuario}
            ]
        }
    })
    if(validate){
        if((await bcrypt.compare(req.body.form.senha, validate.senha))){
            const diferencaData = (validate.updatedAt - new Date()) / (1000 * 60 * 60 * 24)*(-1)
            if((validate.stats[0] == '1' || validate.stats[0] == '3' || validate.stats[0] == '2') || (validate.endereco != req.ip && (diferencaData < 1 || diferencaData > 30))){
                const newCodigo = await Codigo(3, validate.id)
                UserConfig.update(
                    { endereco: req.ip, stats: newCodigo},
                    { where: { id: validate.id} }
                )
                EnviarEmail(validate.email, validate.nick, newCodigo, 2)
                return res.json({
                    status: '1',
                    id: validate.id
                });
            }
            var token = jwt.sign({id: validate.id, nick: validate.nick}, "OD2DS8S21DSA4SD4SS3A")
            return res.json({
                status: `0`,
                msg: `Sucesso`,
                token: token
            });
        }
        return res.json({
            status: `07203U`,
            msg: `Senha incorreta`,
        });
    }
    return res.json({
        status: `21170U`,
        msg: `nenhum usuário encontrado!`,
    });
});
router.post('/validar-login', AccountLimiter, async (req, res) => {
    console.log(req.body)
    const validate = await UserConfig.findOne({
        where: {
            id: req.body.id
        }
    })
    if(validate){
        if(validate.stats[0] == 3){
            const codParaValidar = validate.stats.split('&')[2].toString().toUpperCase()
            const codDigitado = req.body.form.a+req.body.form.b+req.body.form.c+req.body.form.d+req.body.form.e+req.body.form.f
            var countValidar = 0
            for(countValidar = 0; countValidar < 6; countValidar++){
                if(codParaValidar[countValidar] != codDigitado[countValidar].toString().toUpperCase()){
                    console.log(codParaValidar[countValidar]+'1'+codDigitado[countValidar].toString().toUpperCase())
                    countValidar = 500
                }
            }
            if(countValidar > 100){
                return res.json({
                    status: `1`,
                    msg: `ops, codigo digitado invalido, tente verificar possiveis erros, ou refaça o login!`,
                });
            }
            UserConfig.update(
                { stats: `0` },
                { where: { id: validate.id} }
            )
            var token = jwt.sign({id: validate.id, nick: validate.nick}, "OD2DS8S21DSA4SD4SS3A")
            return res.json({
                status: `0`,
                msg: `sucesso`,
                token: token
            });
        }else{
            return res.json({
                status: `09023V`,
                msg: `esta ação esta indisponivel, tente realizar o login novamente, assim, iremos confirmar a sua identidade novamente`,
            });
        }
    }
    return res.json({
        status: `21170U`,
        msg: `nenhum usuário encontrado!`,
    });
});
router.post('/validar-cadastro', AccountLimiter, async (req, res) => {
    console.log(req.body)
    if(req.body.stats != 1){
        return res.json({
            status: '3',
            erro: `08081VC`,
            msg: `Link Errado, tente realizar o login, assim, iremos confirmar a sua identidade novamente`,
        });
    }
    const validate = await UserConfig.findOne({
        where: {
            id: req.body.id
        }
    })
    if(validate){
        if(validate.stats[0] == 1){
            if(validate.stats == `${req.body.stats}&${req.body.id}&${req.body.cod}`){
                UserConfig.update(
                    { stats: '0' },
                    { where: { id: req.body.id} }
                  )
                  return res.json({
                    status: '0',
                    erro: '0',
                    msg: `Usuário validado`,
                  });
            }
            return res.json({
                status: '2',
                erro: `10020VC`,
                msg: `Link expirado, tente realizar o login, assim, iremos confirmar a sua identidade novamente`,
            });
        }
        return res.json({
            status: '1',
            erro: `0`,
            msg: `Conta ja validade, tente realizar o login`,
        });
    }
    return res.json({
        status: '3',
        erro: `21170VC`,
        msg: `Tem alguma coisa errada com o link, pois não encontramos um usuário correspondente, tente realizar o login, assim, iremos confirmar a sua identidade novamente`,
    });
});
router.post('/rec-email-senha', AccountLimiter, async (req, res) => {
    console.log(req.body)
    const validate = await UserConfig.findOne({
        where: {
            email: req.body.form.email
        }
    })
    if(validate){
        const codigoEmail = await Codigo(2, validate.id)
        EnviarEmail(validate.email, validate.nick, codigoEmail, 1)
        UserConfig.update(
            { stats: codigoEmail },
            { where: { id: validate.id} }
          )
          return res.json({
            status: `1`,
            msg: `email enviado`,
        });
    }
    return res.json({
        status: `21170U`,
        msg: `nenhum usuário encontrado!`,
    });
});
router.post('/rec-senha', AccountLimiter, async (req, res) => {
    console.log(req.body)
    if(req.body.stats != 2){
        return res.json({
            erro: `1233RS`,
            msg: `Link errado, tente pedir um novo link!`,
        });
    }
    const validate = await UserConfig.findOne({
        where: {
            id: req.body.id
        }
    })
    if(validate){
        if(validate.stats[0] == 2){
            if(validate.stats == `${req.body.stats}&${req.body.id}&${req.body.cod}`){
                req.body.senha = await bcrypt.hash(req.body.senha, 8);
                UserConfig.update(
                    { stats: '0', senha: req.body.senha },
                    { where: { id: validate.id} }
                  )
                  return res.json({
                    status: `0`,
                    msg: `sucesso`,
                });
            }
            return res.json({
                status: `2117RS`,
                msg: `link expirado, tente pedir um novo link!`,
            });
        }
        return res.json({
            status: `1612RS`,
            msg: `ops, parece que você não pediu para recuperar a senha, provavelmente este link esta incorreto =/`,
        });
    }
    return res.json({
        status: `21170U`,
        msg: `nenhum usuário encontrado!`,
    });
});
module.exports = router;