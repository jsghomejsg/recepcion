const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    // Permisos para que tu web de GitHub Pages pueda comunicarse con Vercel
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
        const { nombre_cliente, telefono, email, matricula, modelo, kilometros, servicio, observaciones, firma } = req.body;

        // Configuramos el motor de envío con tu cuenta de Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER, 
                pass: process.env.GMAIL_PASS  
            }
        });

        // Estructura del correo electrónico que te llegará a ti y al cliente
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: [process.env.GMAIL_USER, email].join(','), 
            subject: `Recepción Detailing - ${servicio} - ${matricula}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
                    <h2 style="background: #10b981; color: white; padding: 15px; margin: 0; border-radius: 8px 8px 0 0; text-align: center;">ORDEN DE RECEPCIÓN - DETAILING PRO</h2>
                    <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                        <h3>Datos del Cliente</h3>
                        <p><strong>Nombre:</strong> ${nombre_cliente}</p>
                        <p><strong>Teléfono:</strong> ${telefono}</p>
                        <p><strong>Email:</strong> ${email === 'notiene@email.com' ? 'El cliente no tiene correo' : email}</p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <h3>Datos del Vehículo</h3>
                        <p><strong>Matrícula:</strong> ${matricula}</p>
                        <p><strong>Marca / Modelo:</strong> ${modelo}</p>
                        <p><strong>Kilómetros:</strong> ${kilometros}</p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <h3>Servicio Contratado</h3>
                        <p><strong>Tipo de Lavado:</strong> <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${servicio}</span></p>
                        <p><strong>Observaciones previas:</strong> ${observaciones || 'Sin observaciones'}</p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <h3>Firma de Conformidad LOPD</h3>
                        <p style="font-size: 11px; color: #666;">El cliente autoriza el servicio de limpieza y confirma el estado de roces reflejado en las observaciones.</p>
                        <div style="border: 1px solid #ccc; background: #fff; padding: 10px; display: inline-block; border-radius: 4px;">
                            <img src="${firma}" alt="Firma" style="max-width: 100%; height: auto;"/>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
