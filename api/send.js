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
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64 } = req.body;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Si no hay correo de cliente, se autoenvía a ti mismo para romper bucles
        const correoDestino = (emailCliente && emailCliente.trim() !== "") ? emailCliente.trim() : process.env.GMAIL_USER;

        const mailOptions = {
            from: `"Resguardo Detailing" <${process.env.GMAIL_USER}>`,
            to: correoDestino,
            bcc: process.env.GMAIL_USER, // Te llega copia oculta directa a ti siempre
            subject: `📄 Resguardo de Recepción - ${(matricula || 'N/A').toUpperCase()}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #1e3a8a;">RECEPCIÓN DETAILING PRO</h2>
                    <p>Estimado/a cliente, le adjuntamos el resguardo oficial de depósito y estado de su vehículo en formato PDF.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p><strong>🚗 Matrícula:</strong> ${(matricula || 'N/A').toUpperCase()}</p>
                    <p><strong>👤 Cliente:</strong> ${nombre}</p>
                    <p><strong>📞 Teléfono:</strong> ${telefono}</p>
                    <p><strong>🛠️ Servicios:</strong> ${trabajos || 'General'}</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 11px; color: #777;">Abra el archivo PDF adjunto para visualizar la orden de taller completa con las fotos y firmas.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `RECEPCION_${(matricula || 'VEHICULO').toUpperCase()}.pdf`,
                    content: pdfBase64,
                    encoding: 'base64'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Error en el motor de correo: " + error.message });
    }
}
