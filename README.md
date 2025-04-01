# MyGuard - AI-Powered Contract Analysis

MyGuard is an intelligent contract analysis tool built on the Internet Computer (ICP) platform that helps users identify potentially risky clauses in legal documents using AI-powered analysis.

## Features

- 🔍 Smart contract clause analysis
- ⚡ Real-time risk assessment
- 🤖 AI-powered chatbot assistant
- 📊 Clear visualization of analysis results
- 🔒 Secure and private analysis

## Prerequisites

Before running MyGuard, ensure you have the following installed:

1. **Rust and Cargo**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   rustup target add wasm32-unknown-unknown
   sudo apt update
   sudo apt install build-essential
   ```

2. **DFX (Internet Computer SDK)**
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

3. **Node.js and npm** (v16 or higher recommended)
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

## Project Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hirwaroger/Guard.git
   cd Guard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the local Internet Computer replica**
   ```bash
   dfx start --clean --background
   ```

4. **Deploy the canisters**
   ```bash
   chmod +x deploy.sh && ./deploy.sh
   ```


## Project Structure

```
myGuard/
├── src/
│   ├── myGuard_frontend/     # Frontend React application
│   │   ├── src/
│   │   │   ├── App.jsx      # Main application component
│   │   │   └── index.scss   # Styles
│   │   └── assets/          # Static assets
│   └── myGuard_backend/     # Rust backend canister
│       └── src/
│           └── lib.rs       # Backend logic
├── dfx.json                 # DFX configuration
└── package.json            # Project dependencies
```

## Configuration

1. **Backend Configuration**
   - The backend uses a pre-trained dataset for contract analysis
   - Modify `src/myGuard_backend/src/lib.rs` to adjust analysis parameters

2. **Frontend Configuration**
   - Environment variables can be set in `.env`
   - UI components are in `src/myGuard_frontend/src/App.jsx`

## Production Deployment

1. **Build for production**
   ```bash
   dfx build --network ic
   ```

2. **Deploy to IC network**
   ```bash
   dfx deploy --network ic
   ```
## Troubleshooting

### Common Issues

1. **Rust Compilation Errors**
   - Ensure Rust and wasm target are properly installed
   - Try `cargo clean` and rebuild

2. **DFX Connection Issues**
   - Verify dfx is running: `dfx start --clean`
   - Check network connectivity

3. **Frontend Build Problems**
   - Clear npm cache: `npm clean-cache --force`
   - Reinstall dependencies: `npm ci`

### Error Messages

- `Error: Cannot find dfx`: Make sure dfx is installed and in your PATH
- `Error: Rust compiler not found`: Install Rust and required targets
- `Error: Connection refused`: Start dfx service first

## Security Considerations

- This tool is for educational purposes only
- Do not input sensitive or confidential information
- Results should be reviewed by legal professionals
- Data is processed locally within the IC canister

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support and questions:
- Open an issue in the repository
- Contact the development team

## Team Members

- IZERE HIRWA Roger - roger@hdev.rw
- TURIKUMWENIMANA Daniel - daniel@hdev.rw

## Acknowledgments

- Built with Internet Computer (ICP)
- Uses React for frontend
- Rust-based backend processing
- AI-powered analysis engine

---

**Note**: This is an educational tool and should not be used as a replacement for professional legal advice. Always consult with qualified legal professionals for important contract matters.
