const PureGym = require('./lib/PureGym')

const email = "your email";
const pin = "your pin";

const main = async () => {
    const Gym = new PureGym(email, pin);

    const login = await Gym.auth();

    const activities = Gym.getActivity();
    console.log('activity', activities);

}

main();