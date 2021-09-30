const qs = require('query-string')
const superagent = require('superagent');
const { parse } = require( 'node-html-parser');

class PureGym {
    constructor(email, pin){
        this.email = email;
        this.pin = pin;
        this.agent = superagent.agent();
    }

    auth(){
        return new Promise((resolve, rej) => {
            const agent = this.agent
            // get login page + session
            agent.get('https://www.puregym.com/login/')
            .then(res => {

                // get login url + states
                const postUrl = res.redirects.pop();

                // get request token
                const token = res.text.match(/<input name="__RequestVerificationToken" type="hidden" value="(?<token>[A-Za-z0-9_-]+)" \/>/m).groups.token;

                const postData = {
                    username: this.email,
                    password: this.pin,
                    button: 'login',
                    __RequestVerificationToken: token
                }

                // perform initial submit
                agent.post(postUrl)
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(qs.stringify(postData))
                    .then(res => {

                        // get all data to post final login check
                        const auth_action = res.text.match(/action='(?<action>[a-z\.:\/\-_]+)'/m);
                        const auth_code =  res.text.match(/name='code' value='(?<code>[a-z0-9\.:\/\-_]+)'/m);
                        const auth_id_token =  res.text.match(/name='id_token' value='(?<id_token>[a-zA-Z0-9\.:\/\-_]+)'/m);
                        const auth_state =  res.text.match(/name='state' value='(?<state>[a-zA-Z0-9\.:\/\-_]+)'/m);
                        const auth_session_state =  res.text.match(/name='session_state' value='(?<session_state>[a-zA-Z0-9\.:\/\-_]+)'/m);
                        const auth_scope =  res.text.match(/name='scope' value='(?<scope>[a-zA-Z0-9\.:\/\-_ ]+)'/m);

                        /*
                        debug info
                        console.log('action', auth_action.groups.action);
                        console.log('code', auth_code.groups.code);
                        console.log('id_token', auth_id_token.groups.id_token);
                        console.log('scope', auth_scope.groups.scope);
                        console.log('session_state', auth_session_state.groups.session_state);
                        console.log('state', auth_state.groups.state);
                        */

                        // build form
                        const loginParams = {
                            code: auth_code.groups.code,
                            id_token: auth_id_token.groups.id_token,
                            scope: auth_scope.groups.scope,
                            session_state: auth_session_state.groups.session_state,
                            state: auth_state.groups.state,
                        }

                        // submit security form
                        agent.post(auth_action.groups.action)
                            .set('Content-Type', 'application/x-www-form-urlencoded')
                            .send(qs.stringify(loginParams))
                            .then(res => {
                                resolve(res.text)
                            })
                            .catch(rej);
                    })
                    .catch(rej)

            })
            .catch(rej)
       })
    }

    getActivity(){
        const agent = this.agent;
        return new Promise((res, rej) => {
            agent.get('https://www.puregym.com/members/activity/')
            .then(resp => {
                const page = parse(resp.text)
                var activities = page.querySelectorAll('.calendar-column ul li');

                activities = activities.map(a => ({
                    date: a.querySelector('.calendar-card__date').text,
                    entry_time:  a.querySelector('.calendar-card__entry-time').text,
                    gym:  a.querySelector('.calendar-card__gym').text,
                    class:  a.querySelector('.calendar-card__class').text,
                    duration:  a.querySelector('.calendar-card__duration').text,
                }));

                return res(activities);
                
            })
            .catch(rej)
        })
    }
}

module.exports = PureGym;