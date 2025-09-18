import { Stapply } from '@/components/logo'
import { cn } from '@/lib/utils'
import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 24,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '25%',
                }}
            >
                <svg
                    width={28}
                    height={28}
                    viewBox="0 0 24 24"
                    style={{
                        textAlign: 'center',
                    }}
                    fill="currentColor"
                >
                    {/* Card-style documents with rounded corners */}
                    <rect
                        x="3"
                        y="6"
                        width="14"
                        height="16"
                        rx="2"
                        style={{
                            fill: '#1e40af',
                            fillOpacity: 0.4,
                        }}
                    />
                    <rect
                        x="4"
                        y="4"
                        width="14"
                        height="16"
                        rx="2"
                        style={{
                            fill: '#1e3a8a',
                            fillOpacity: 0.9,
                        }}
                    />
                    <rect
                        x="5"
                        y="2"
                        width="14"
                        height="16"
                        rx="2"
                        style={{
                            fill: '#1e293b',
                            fillOpacity: 1,
                        }}
                    />

                    {/* Header section on top card */}
                    <rect
                        x="7"
                        y="4"
                        width="10"
                        height="3"
                        rx="1"
                        style={{
                            fill: '#f0f9ff',
                        }}
                    />

                    {/* Content lines */}
                    <line
                        x1="7"
                        y1="9"
                        x2="17"
                        y2="9"
                        strokeWidth="1"
                        style={{
                            stroke: '#f0f9ff',
                            strokeOpacity: 0.8,
                        }}
                    />
                    <line
                        x1="7"
                        y1="11"
                        x2="15"
                        y2="11"
                        strokeWidth="1"
                        style={{
                            stroke: '#f0f9ff',
                            strokeOpacity: 0.8,
                        }}
                    />
                    <line
                        x1="7"
                        y1="13"
                        x2="16"
                        y2="13"
                        strokeWidth="1"
                        style={{
                            stroke: '#f0f9ff',
                            strokeOpacity: 0.8,
                        }}
                    />
                </svg>
            </div>
        ),
        // ImageResponse options
        {
            // For convenience, we can re-use the exported icons size metadata
            // config to also set the ImageResponse's width and height.
            ...size,
        }
    )
}