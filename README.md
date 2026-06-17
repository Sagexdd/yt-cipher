# 🚀 yt-cipher (Vercel Hostable)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.x-blue.svg)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com)

A high-performance, serverless Node.js & TypeScript port of Deno's `yt-cipher`. Designed to solve YouTube signature deciphering and `n`-parameter challenges directly on Vercel's serverless infrastructure. Perfectly optimized to act as the backend cipher service for **Lavalink** and other media-streaming libraries.

---

## ⚡ Quick Deploy

Deploy your own instance of the cipher resolver to Vercel with a single click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSagexdd%2Fyt-cipher)

---

## 🌐 Public Instance

A public instance of this service is hosted and maintained for the community:

* **URL**: `https://cipher.lavalink-harmonix.me/`

> [!WARNING]
> This public instance is provided on a best-effort basis without any guarantees of uptime or performance. For production applications, it is highly recommended to deploy your own private instance using the quick deploy button above.

---

## ✨ Features

- **Vercel Serverless Ready**: Designed to fit seamlessly into stateless serverless functions without the need for worker pools.
- **Fast & Lightweight Parser**: Uses `meriyah` and `astring` for blazing-fast AST parsing and code generation.
- **Optimized Caching**: Stores parsed player scripts locally in `/tmp` and caches preprocessed solvers in memory, avoiding redundant downloads and parsing cycles.
- **Interactive API Documentation**: Runs a built-in Swagger UI and documentation page at the root route `/`.
- **Prometheus Metrics**: Inbuilt `/metrics` endpoint to monitor hit counts, error rates, and response latency.

---

## 🛠️ API Specification

### 1. Decrypt Signature
Solve the signature and `n`-parameter challenge for a given player script.

* **Endpoint**: `POST /decrypt_signature`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "player_url": "https://www.youtube.com/s/player/959dabb2/player_ias.vflset/en_US/base.js",
    "encrypted_signature": "AIzaSyD-aW8n_sX7rK_12345",
    "n_param": "AIzaSyD-aW8n_sX7rK_12345"
  }
  ```
* **Response**:
  ```json
  {
    "decrypted_signature": "W21_Xr37s_n8Ka-DySa",
    "decrypted_n_sig": "6wLVP2zMPhCit47nW2wgU"
  }
  ```

---

### 2. Get Short-Term Secret (STS)
Retrieve the Short-Term Secret signature timestamp integer required by some streaming tools.

* **Endpoint**: `POST /get_sts`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "player_url": "https://www.youtube.com/s/player/959dabb2/player_ias.vflset/en_US/base.js"
  }
  ```
* **Response**:
  ```json
  {
    "sts": "20614"
  }
  ```

---

### 3. Resolve URL
Process a full YouTube stream URL, resolving both signature and `n`-parameter values directly.

* **Endpoint**: `POST /resolve_url`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "player_url": "https://www.youtube.com/s/player/959dabb2/player_ias.vflset/en_US/base.js",
    "stream_url": "https://rr2---sn-4g57kn7e.googlevideo.com/videoplayback?expire=1718580000&ei=abcd&ip=1.1.1.1&id=efgh&n=AIzaSyD-aW8n_sX7rK_12345",
    "encrypted_signature": "AIzaSyD-aW8n_sX7rK_12345"
  }
  ```
* **Response**:
  ```json
  {
    "resolved_url": "https://rr2---sn-4g57kn7e.googlevideo.com/videoplayback?expire=1718580000&ei=abcd&ip=1.1.1.1&id=efgh&n=6wLVP2zMPhCit47nW2wgU&sig=W21_Xr37s_n8Ka-DySa"
  }
  ```

---

## 🎵 Integration with Lavalink

To use this cipher service in your Lavalink setup:

1. Open your Lavalink `application.yml` file.
2. Configure the YouTube source plugin block:
   ```yaml
   plugins:
     youtube:
       remoteCipher:
         url: "https://cipher.lavalink-harmonix.me/"
         userAgent: "your_service_name" # Optional
   ```
3. Restart Lavalink. YouTube track loading errors will disappear.

---

## ⚙️ Configuration & Environment Variables

You can customize runtime behavior using the following environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local dev server listening port | `8001` |
| `API_TOKEN` | Bearer token required for API `Authorization` header | *(None - Public)* |
| `IGNORE_SCRIPT_REGION` | Ignore region hashes when caching scripts | `false` |

---

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sagexdd/yt-cipher.git
   cd yt-cipher
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start local development server**:
   ```bash
   npm run dev
   ```
   The local server will run at `http://localhost:8001`. You can open the root URL in your browser to view the interactive documentation.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
