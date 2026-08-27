import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (número o texto del mensaje).' },
        { status: 400 }
      );
    }

    // URL de tu servidor Baileys / WhatsApp local o en producción
    const SENDER_URL = process.env.WHATSAPP_API_URL || 'http://localhost:3001/api/send';

    const response = await fetch(SENDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'No se pudo enviar el WhatsApp desde el bot.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error enviando cotización por WhatsApp:', error);
    return NextResponse.json(
      { error: 'Error interno o servidor de WhatsApp desconectado.' },
      { status: 500 }
    );
  }
}