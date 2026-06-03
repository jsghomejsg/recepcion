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
        // Recogemos las variables que manda el formulario (incluyendo el PDF en base64)
        const { matricula, nombre, telefono, email, emailCliente, observaciones, trabajos, pdfBase64 } = req.body;

        // Validamos cuál de los dos campos de email viene del formulario para no perderlo
        const correoDelCliente = email || emailCliente;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Evitamos bucles: si no hay email del cliente, se autoenvía a tu correo
        const correoDestino = (correoDelCliente && correoDelCliente.trim() !== "") ? correoDelCliente.trim() : process.env.GMAIL_USER;

        const mailOptions = {
            from: `"Recepcion Pro" <${process.env.GMAIL_USER}>`,
            to: correoDestino,
            bcc: process.env.GMAIL_USER, // Te llega siempre una copia oculta a ti para control
            subject: `📄 Resguardo de Recepción - Matrícula: ${(matricula || 'N/A').toUpperCase()}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #1e3a8a;">RECEPCIÓN PRO DETAILED</h2>
                    <p>Estimado/a cliente, le adjuntamos en formato PDF el resguardo oficial de depósito y estado de su vehículo en nuestras instalaciones.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p><strong>🚗 Matrícula:</strong> ${(matricula || 'N/A').toUpperCase()}</p>
                    <p><strong>👤 Cliente:</strong> ${nombre || 'No especificado'}</p>
                    <p><strong>📞 Teléfono:</strong> ${telefono || 'No especificado'}</p>
                    <p><strong>🛠️ Observaciones:</strong> ${observaciones || trabajos || 'General'}</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 11px; color: #777;">Este es un correo automático con el documento digitalizado adjunto.</p>
                </div>
            `,
            attachments: pdfBase64 ? [
                {
                    filename: `RECEPCION_${(matricula || 'VEHICULO').toUpperCase()}.pdf`,
                    content: pdfBase64.split("base64,")[1] || pdfBase64,
                    encoding: 'base64'
                }
            ] : [] // Si la web no manda el PDF por lo que sea, el correo se envía igual sin romperse
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Error en el motor de correo: " + error.message });
    }
}
