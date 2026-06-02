import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply.recepcionpro@gmail.com',
        pass: 'iuulukadxfsldvcd', // 👈 Ponemos la clave directa para que no dependa de Vercel
      },
    });

    const mailOptions = {
      from: 'noreply.recepcionpro@gmail.com',
      to: 'noreply.recepcionpro@gmail.com',
      subject: 'Nueva Recepción Pro Registrada',
      text: 'Se ha procesado una nueva recepción correctamente en el sistema.',
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
