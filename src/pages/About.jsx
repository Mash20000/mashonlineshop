import { Link } from 'react-router-dom';

const values = [
  ['Quality you can trust', 'We choose the products we list with care, so what you see is what you get.'],
  ['Simple, safe payment', 'Pay with M-Pesa. You confirm every payment yourself on your own phone.'],
  ['Friendly support', 'Questions about an order? Chat with the shop from the Messages page and we will reply.'],
];

const steps = [
  ['Browse', 'Look through the products or search by name and category.'],
  ['Add to cart', 'Pick what you like and review your cart.'],
  ['Pay with M-Pesa', 'Enter your name and phone number and approve the prompt on your phone.'],
  ['Get updates', 'We confirm your order and send delivery news to your Account page, where you can rate what you received.'],
];

export default function About() {
  return (
    <div className="space-y-14">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-14 text-center text-white md:px-12">
        <h1 className="text-4xl font-extrabold md:text-5xl">About Mash Online Shop</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">
          Mash Online Shop is a small online store built to make buying simple: clear products, honest prices and a checkout
          that works the way most of us already pay, with M-Pesa.
        </p>
      </section>

      <section className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold text-gray-900">Our story</h2>
        <p className="mt-3 text-gray-600">
          We started Mash Online Shop to bring everyday products to your phone or computer without the hassle. New items are
          added to the shop regularly, so there is always something fresh to look at. Whether you are shopping for yourself
          or for someone else, we want the experience to be easy from the first click to the delivery message.
        </p>
      </section>

      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">What we stand for</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {values.map(([title, text]) => (
            <div key={title} className="card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                {title[0]}
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">How it works</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map(([title, text], i) => (
            <div key={title} className="card p-5">
              <span className="text-3xl font-extrabold text-brand-500">{i + 1}</span>
              <h3 className="mt-1 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col items-center gap-3 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">Have a question?</h2>
        <p className="text-gray-600">Send us a message in the chat and we will get back to you.</p>
        <div className="flex gap-3">
          <Link to="/messages" className="btn-outline">Chat with us</Link>
          <Link to="/products" className="btn-primary">Start shopping</Link>
        </div>
      </section>
    </div>
  );
}
