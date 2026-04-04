export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          ENStealth Unlinked
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
          Privacy-focused payments combining ENS, stealth addresses, and Unlink
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">🔐 Stealth Addresses</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Hide payment destinations using cryptographic stealth addresses
          </p>
          <a
            href="/merchant/create"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create merchant →
          </a>
        </div>

        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">🌐 ENS Integration</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Store stealth address keys in ENS records
          </p>
          <a
            href="/merchant/create"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            >
            Setup ENS →
          </a>
        </div>

        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">💸 Accept Payments</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Accept payments via WalletConnect or Unlink
          </p>
          <a
            href="/pay/example.enstealth.eth"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try demo →
          </a>
        </div>

        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">👻 Private Sender</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Use Unlink to hide transaction origin
          </p>
          <a
            href="/pay/example.enstealth.eth?method=unlink"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Pay privately →
          </a>
        </div>

        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">💰 Withdraw Funds</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Scan and collect funds received to stealth addresses
          </p>
          <a
            href="/merchant/withdraw"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Withdraw →
          </a>
        </div>

        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">📖 How It Works</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Learn about the cryptography and architecture
          </p>
          <a
            href="https://github.com/jordan-public/enstealth-unlinked"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Read docs →
          </a>
        </div>
      </div>

      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="ml-4">
              <h4 className="font-semibold">Create Merchant Account</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Generate stealth keys and configure ENS records
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="ml-4">
              <h4 className="font-semibold">Accept Payments</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Share your ENS name for customers to send stealth payments
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="ml-4">
              <h4 className="font-semibold">Withdraw Funds</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Scan for payments and withdraw to your wallet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
