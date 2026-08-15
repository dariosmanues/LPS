import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

// Singleton serial port manager
let port: SerialPort | null = null;
let parser: ReturnType<SerialPort['pipe']> | null = null;
let lastData: string | null = null;
let isConnected = false;
let connectionError: string | null = null;
const dataBuffer: string[] = [];
const MAX_BUFFER_SIZE = 100;

export interface SerialConfig {
    path: string;
    baudRate: number;
    dataBits?: 5 | 6 | 7 | 8;
    parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
    stopBits?: 1 | 1.5 | 2;
    delimiter?: string;
}

const DEFAULT_CONFIG: SerialConfig = {
    path: 'COM3',
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    delimiter: '\r\n',
};

/**
 * Connect to serial port
 */
export function connectSerial(config: Partial<SerialConfig> = {}): Promise<boolean> {
    return new Promise((resolve) => {
        // Close existing connection if any
        if (port?.isOpen) {
            port.close();
        }

        const mergedConfig = { ...DEFAULT_CONFIG, ...config };

        try {
            port = new SerialPort({
                path: mergedConfig.path,
                baudRate: mergedConfig.baudRate,
                dataBits: mergedConfig.dataBits,
                parity: mergedConfig.parity,
                stopBits: mergedConfig.stopBits,
                autoOpen: false,
            });

            parser = port.pipe(new ReadlineParser({ delimiter: mergedConfig.delimiter || '\r\n' }));

            port.open((err) => {
                if (err) {
                    connectionError = err.message;
                    isConnected = false;
                    console.error('❌ Gagal membuka port serial:', err.message);
                    resolve(false);
                    return;
                }

                isConnected = true;
                connectionError = null;
                console.log(`✅ Koneksi RS232 Berhasil Dibuka! (${mergedConfig.path} @ ${mergedConfig.baudRate})`);
                resolve(true);
            });

            // Listen for data
            parser.on('data', (data: string) => {
                const trimmedData = data.trim();
                if (trimmedData) {
                    lastData = trimmedData;
                    dataBuffer.push(trimmedData);
                    if (dataBuffer.length > MAX_BUFFER_SIZE) {
                        dataBuffer.shift();
                    }
                    console.log('📩 Data Masuk:', trimmedData);
                }
            });

            port.on('error', (err) => {
                connectionError = err.message;
                isConnected = false;
                console.error('⚠️ Error Serial:', err.message);
            });

            port.on('close', () => {
                isConnected = false;
                console.log('🔌 Port serial ditutup');
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            connectionError = errorMessage;
            isConnected = false;
            console.error('❌ Error membuat koneksi serial:', errorMessage);
            resolve(false);
        }
    });
}

/**
 * Disconnect serial port
 */
export function disconnectSerial(): Promise<boolean> {
    return new Promise((resolve) => {
        if (port?.isOpen) {
            port.close((err) => {
                if (err) {
                    console.error('❌ Gagal menutup port:', err.message);
                    resolve(false);
                    return;
                }
                port = null;
                parser = null;
                isConnected = false;
                lastData = null;
                dataBuffer.length = 0;
                resolve(true);
            });
        } else {
            port = null;
            parser = null;
            isConnected = false;
            resolve(true);
        }
    });
}

/**
 * Send data to serial port
 */
export function sendSerial(data: string): Promise<boolean> {
    return new Promise((resolve) => {
        if (!port?.isOpen) {
            console.error('❌ Port serial tidak terbuka');
            resolve(false);
            return;
        }

        port.write(data, (err) => {
            if (err) {
                console.error('❌ Gagal mengirim:', err.message);
                resolve(false);
                return;
            }
            console.log('📤 Pesan terkirim:', data);
            resolve(true);
        });
    });
}

/**
 * Get current status and latest data
 */
export function getSerialStatus() {
    return {
        isConnected,
        lastData,
        error: connectionError,
        portPath: port?.path || null,
        dataBuffer: [...dataBuffer],
    };
}

/**
 * Get and clear the latest data (consume pattern)
 */
export function consumeLastData(): string | null {
    const data = lastData;
    lastData = null;
    return data;
}

/**
 * Get and clear all buffered data
 */
export function consumeBuffer(): string[] {
    const buffered = [...dataBuffer];
    dataBuffer.length = 0;
    return buffered;
}

/**
 * List available serial ports
 */
export async function listSerialPorts() {
    try {
        const ports = await SerialPort.list();
        return ports.map((p) => ({
            path: p.path,
            manufacturer: p.manufacturer || 'Unknown',
            serialNumber: p.serialNumber || '-',
            pnpId: p.pnpId || '-',
        }));
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Gagal list ports:', errorMessage);
        return [];
    }
}
