import navBar from './navBar';

export default function hero() {
    return (
        <div>
            {navBar()}

            <section className="flex flex-col items-center justify-center h-screen bg-gray-100 w-full" >
                <h1 className="text-4xl font-bold text-black">
                    Real breaches,   
                </h1>
                <h1 className="text-4xl font-bold text-green-600">
                   Real bugs, real skill
                </h1>
          </section>

        </div>
    );
}