declare module 'sanitize-html';

declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: any, callback?: (err: Error | null, info: any) => void): Promise<any>;
  }
  export function createTransport(options: any): Transporter;
}
