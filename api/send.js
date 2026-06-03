import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { matricula, nombre, telefono, email, emailCliente, observaciones, marca, modelo, firma, fotos } = req.body;
        const correoDelCliente = email || emailCliente;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        const attachments = [];
        let fotosHtml = '';

        // 1. Procesar la firma si existe
        if (firma) {
            attachments.push({
                filename: 'firma.png',
                content: firma.split("base64,")[1],
                encoding: 'base64',
                cid: 'signatureImage'
            });
        }

        // 2. Procesar las fotos si existen
        if (fotos && Array.isArray(fotos)) {
            fotos.forEach((foto, index) => {
                if (foto) {
                    const cidName = `evidencia_foto_${index + 1}`;
                    attachments.push({
                        filename: `${cidName}.jpg`,
                        content: foto.split("base64,")[1],
                        encoding: 'base64',
                        cid: cidName
                    });
                    fotosHtml += `
                        <div style="display: inline-block; width: 45%; margin: 2%; text-align: center; border: 1px solid #ccc; padding: 5px;">
                            <p style="margin:0 0 5px 0; font-size:11px; font-weight:bold; color:#555;">Foto Evidencia ${index + 1}</p>
                            <img src="cid:${cidName}" style="width:100%; max-height:180px; object-fit:contain;" />
                        </div>
                    `;
                }
            });
        }

        // 3. Crear el documento oficial que irá DENTRO del archivo PDF adjunto
        const htmlDocumentoOficial = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; color: #333; padding: 10px; }
                    .hoja { max-width: 700px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
                    .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
                    .seccion { margin-bottom: 20px; }
                    .seccion-titulo { font-size: 14px; font-weight: bold; background: #f3f4f6; padding: 5px; margin-bottom: 10px; text-transform: uppercase; color: #1e3a8a; }
                    .campo { margin-bottom: 8px; font-size: 13px; }
                    .label { font-weight: bold; color: #555; }
                </style>
            </head>
            <body>
                <div class="hoja">
                    <div class="header">
                        <h2 style="margin:0; color:#1e3a8a;">ORDEN DE RECEPCIÓN DIGITAL</h2>
                        <p style="margin:5px 0 0 0; font-size:12px; color:#666;">Resguardo Oficial de Depósito</p>
                    </div>
                    <div class="seccion">
                        <div class="seccion-titulo">Datos del Cliente</div>
                        <div class="campo"><span class="label">Nombre:</span> ${nombre || 'No especificado'}</div>
                        <div class="campo"><span class="label">Teléfono:</span> ${telefono || 'No especificado'}</div>
                        <div class="campo"><span class="label">Email:</span> ${correoDelCliente || 'No especificado'}</div>
                    </div>
                    <div class="seccion">
                        <div class="seccion-titulo">Datos del Vehículo</div>
                        <div class="campo"><span class="label">Vehículo:</span> ${marca || ''} ${modelo || ''}</div>
                        <div class="campo"><span class="label">Matrícula:</span> <strong>${(matricula || 'N/A').toUpperCase()}</strong></div>
                    </div>
                    <div class="seccion">
                        <div class="seccion-titulo">Observaciones / Estado</div>
                        <div style="border:1px dashed #ccc; padding:10px; font-size:13px; background:#fafafa;">
                            ${observaciones || 'Sin observaciones previas.'}
                        </div>
                    </div>
                    <div class="seccion" style="text-align:center; margin-top:30px;">
                        <p style="font-size:12px; font-weight:bold; margin:0 0 10px 0;">Firma de Conformidad del Cliente</p>
                        ${firma ? `<img src="cid:signatureImage" style="max-width:200px; max-height:80px;" />` : '<p style="color:#aaa;">No firmada</p>'}
                    </div>
                    ${fotosHtml ? `
                        <div class="seccion" style="margin-top:30px;">
                            <div class="seccion-titulo">Evidencias Fotográficas</div>
                            <div style="text-align:center;">${fotosHtml}</div>
                        </div>
                    ` : ''}
                </div>
            </body>
            </html>
        `;

        // 4. Adjuntamos el archivo HTML directamente como si fuera el PDF imprimible
        attachments.push({
            filename: `RECEPCION_${(matricula || 'VEHICULO').toUpperCase()}.html`, // Se abre directo en cualquier PC/Móvil listo para imprimir impecable
            content: htmlDocumentoOficial,
            encoding: 'utf-8'
        });

        const correoDestino = (correoDelCliente && correoDelCliente.trim() !== "") ? correoDelCliente.trim() : process.env.GMAIL_USER;

        const mailOptions = {
            from: `"Recepcion Pro" <${process.env.GMAIL_USER}>`,
            to: correoDestino,
            bcc: process.env.GMAIL_USER,
            subject: `📄 Resguardo de Recepción - Matrícula: ${(matricula || 'N/A').toUpperCase()}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #1e3a8a;">RECEPCIÓN PRO DETAILED</h2>
                    <p>Estimado/a cliente, le adjuntamos el documento oficial de recepción de su vehículo listo para guardar o imprimir.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p><strong>🚗 Matrícula:</strong> ${(matricula || 'N/A').toUpperCase()}</p>
                    <p><strong>👤 Cliente:</strong> ${nombre || 'No especificado'}</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 11px; color: #777;">Descargue el archivo adjunto para visualizar la firma y las fotos del estado del vehículo.</p>
                </div>
            `,
            attachments: attachments
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Error en el motor de correo: " + error.message });
    }
}
