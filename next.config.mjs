/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
			{
				protocol: "https",
				hostname: "img.clerk.com",
			},
			{
				protocol: "https",
				hostname: "images.clerk.dev",
			},

		],
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Frame-Options", value: "ALLOWALL" },
					{
						key: "Content-Security-Policy",
						value: "frame-ancestors 'self' https://devhimanshuu.vercel.app https://*.vercel.app http://localhost:*",
					},
				],
			},
		];
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
};

export default nextConfig;
