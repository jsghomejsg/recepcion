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
        const { matricula, nombre, telefono, email, emailCliente, observaciones, marca, modelo, firma } = req.body;
        const correoDelCliente = email || emailCliente;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        const attachments = [];

        // Si hay firma, la empaquetamos correctamente como imagen adjunta
        if (firma) {
            attachments.push({
                filename: 'firma_cliente.png',
                content: firma.split("base64,")[1],
                encoding: 'base64',
                cid: 'signatureImage'
            });
        }

        // Construimos un documento de texto oficial limpio estructurado para impresión directa
        const textoDocumento = `
==================================================
          DOCUMENTO OFICIAL DE RECEPCIÓN
==================================================
Fecha: ${new Date().toLocaleDateString('es-ES')}
Matrícula: ${(matricula || 'N/A').toUpperCase()}
--------------------------------------------------

DATOS DEL CLIENTE:
------------------
Nombre: ${nombre || 'No especificado'}
Teléfono: ${telefono || 'No especificado'}
Email: ${correoDelCliente || 'No especificado'}

DATOS DEL VEHÍCULO:
-------------------
Vehículo: ${marca || ''} ${modelo || 'No especificado'}
Matrícula: ${(matricula || 'N/A').toUpperCase()}

OBSERVACIONES / ESTADO DEL COCHE:
---------------------------------
${observaciones || 'Sin observaciones previas al servicio.'}

--------------------------------------------------
Documento digitalizado conforme para el taller.
==================================================
`;

        // Adjuntamos la hoja de recepción oficial como un archivo descargable e imprimible
        attachments.push({
            filename: `RECEPCION_${(matricula || 'VEHICULO').toUpperCase()}.txt`,
            content: textoDocumento,
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
                    <h2 style="color: #1e3a8a; margin-top: 0;">RECEPCIÓN PRO DETAILED</h2>
                    <p>Estimado/a cliente, se ha registrado la entrada de su vehículo correctamente.</p>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>🚗 Matrícula:</strong> ${(matricula || 'N/A').toUpperCase()}</p>
                        <p style="margin: 5px 0;"><strong>👤 Cliente:</strong> ${nombre || 'No especificado'}</p>
                        <p style="margin: 5px 0;"><strong>📞 Teléfono:</strong> ${telefono || 'No especificado'}</p>
                        <p style="margin: 5px 0;"><strong>📝 Estado:</strong> ${observaciones || 'General'}</p>
                    </div>

                    <div style="margin-top: 20px;">
                        <p style="margin-bottom: 5px;"><strong>Firma del Cliente:</strong></p>
                        ${firma ? `<img src="cid:signatureImage" style="max-width: 200px; border: 1px solid #eee; padding: 5px; background: #fff;" />` : '<p style="color: #999;">No firmada</p>'}
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 25px;" />
                    <p style="font-size: 12px; color: #666;">Descargue el archivo adjunto de la recepción para disponer del resguardo técnico completo listo para guardar o imprimir.</p>
                </div>
            `,
            attachments: attachments
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Error en el servidor: " + error.message });
    }
}
