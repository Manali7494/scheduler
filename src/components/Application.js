import React, { useState, useEffect } from "react";

import "components/Application.scss";
import DayList from "components/DayList";
import Appointment from "components/Appointment";
import axios from "axios";
import {getAppointmentsForDay, getInterviewersForDay, getInterview} from "../helpers/selectors";

export default function Application(props) {
  const [state, setState] = useState({
    day: "Monday",
    days: [],
    appointments: {}
  });


  const getSpotsForDay = (day, appointments) => {
    return day.appointments.length -
    day.appointments.reduce(
      (count, id) => (appointments[id].interview ? count + 1 : count),
      0
    );
  
  }

  const setDay = day => setState(state => ({ ...state, day }));

  useEffect(() => {
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(
      (all) => 
        setState(state => ({ ...state, days: all[0].data, appointments: all[1].data, interviewers: all[2].data }))
    );
  }, []);

  function bookInterview(id, interview) {
    const appointment = {
      ...state.appointments[id],
      interview: {...interview}
    }

    const appointments = {
      ...state.appointments,
      [id]: appointment
    }
    const getSpotsForDay = day =>
    day.appointments.length -
    day.appointments.reduce(
      (count, id) => (appointments[id].interview ? count + 1 : count),
      0
    );

    const days = state.days.map((day) => day.appointments.includes(id) ? { ...day, spots: getSpotsForDay(day, appointments) } : day)
    return axios.put(`/api/appointments/${id}`, { interview }).then(() => {
      setState({
        ...state,
        appointments,
        days
      })
    });
  }

  function cancelInterview(id) {
    const appointment = {
      ...state.appointments[id],
      interview: null
    }

    const appointments = {
      ...state.appointments,
      [id]: appointment
    }
    const days = state.days.map((day) => day.appointments.includes(id) ? { ...day, spots: getSpotsForDay(day, appointments) } : day)

    return axios.delete(`/api/appointments/${id}`).then(() => {
      setState({
        ...state,
        appointments,
        days
      })
    });
  }

  const interviewers = getInterviewersForDay(state, state.day);

  const appointments = getAppointmentsForDay(state, state.day).map(
    appointment => {
      return (
        <Appointment {...appointment} interview={getInterview(state, appointment.interview)} key={appointment.id} interviewers={interviewers} bookInterview={bookInterview} cancelInterview={cancelInterview}/>
      );
    }
  );


  return (
    <main className="layout">
      <section className="sidebar">
      <img
        className="sidebar--centered"
        src="images/logo.png"
        alt="Interview Scheduler"
      />
      <hr className="sidebar__separator sidebar--centered" />
      <nav className="sidebar__menu">
        <DayList
          days={state.days}
          day={state.day}
          setDay={setDay}
        />        
      </nav>
      <img
        className="sidebar__lhl sidebar--centered"
        src="images/lhl.png"
        alt="Lighthouse Labs"
      />
    </section>
    <section className="schedule">
        {appointments}
        <Appointment key="last" time="5pm" />
    </section>
    </main>
  );
}
