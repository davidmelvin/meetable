// File for our server functions for scheduling OUR meetings/events. (as opposed to Google events)

Meteor.methods({

  // Add the meeting to the user
  // meeting (fullCalMeeting): The meeting to add to t
  // addMeeting: function(meeting) {
  //   var meetings = Meteor.users.findOne(this.userId).meetingEvents;
  //   if (meetings === undefined) meetings = [];
  //
  //   meetings.push(meeting);
  //
  //   Meteor.users.update(this.userId, {
  //     $set: {
  //       meetingEvents: meetings
  //     }
  //   });
  // },

  // Send out an invitation to a meeting/event
  // userEmails ([emails]): An array of the emails to schedule this meeting with
  // title (String): Title of the event/meeting
  // duration (float): Length of the event/meeting
  // TODO: Handle more than Google account
  inviteToMeeting: function(userEmails, title, duration) {
    // The email of the person inviting others to meeting
    var inviterEmail = Meteor.user().services.google.email;
    var invitation = {
      inviter: inviterEmail,
      invited: userEmails,
      title: title,
      length: duration
    }

    // Update the inviters sent invites in the DB
    var invites = Meteor.users.findOne(this.userId).meetingInvitesSent // Pull their meeting invitations
    if (invites === undefined) invites = [];
    invites.push(invitation); // Append
    Meteor.users.update(this.userId, { // Now set the values again
      $set: {
        meetingInvitesSent: invites
      }
    });

    for (var i = 0; i < userEmails.length; i++) {
      // The user being invited
      var user = Meteor.users.findOne({"services.google.email": userEmails[i]});
      // If the user DNE, invite them! :)
      if (user === undefined) {
        // TODO: Perhaps we should have a modal confirmation saying
        // "This user doesn't seem to have an account, would you like to invite them?"
        sendInvitationEmail(inviterEmail, userEmails[i], title);

        // TODO: PROBLEM!!!!!! We need to associate this event with an account that DOES NOT YET EXIST
        // Not TOO hard to handle, just need to create a new collection.
      } else {
        sendNewMeetingEmail(inviterEmail, userEmails[i], title);
        // Also need to add this invitation to their DB point so they can actually schedule it
        invites = Meteor.users.findOne(user._id).meetingInvitesReceived // Pull their meeting invitations
        if (invites === undefined) invites = [];
        invites.push(invitation); // Append
        Meteor.users.update(user._id, { // Now set the values again
          $set: {
            meetingInvitesReceived: invites
          }
        });
      }
    }

  }
});

// Send an invitation email to the inviteeEmail. THIS IS ONLY USED TO INVITED NEW USERS
// inviterEmail (emailString): The email address of the inviter TODO: Make this a name?
// inviteeEmail (emailString): The email address of the person being invited
// title (String): The event title in which a user is being invited.
function sendInvitationEmail(inviterEmail, inviteeEmail, title) {
  var subject = inviterEmail + " wants to meet with you! Join Meetable to schedule it now!";
  var text = inviterEmail + " wants to meet with you for a meeting \"" + title + "\"\n\n" +
            "Schedule your meeting now with Meetable. Forget filling out when you're available by hand, " +
            "Meetable compares your free time from your Google Calendar so you just have to pick one time that " +
            "you already know works for everyone!\n\n" +
            "Join now! https://www.meetable.us\n\n\n" +
            "You are receiving this email because " + inviterEmail + " tried to invite you to Meetable.";
  Meteor.call("sendEmail", inviteeEmail, inviterEmail, subject, text);
}

// Same as above, but text is assuming user already has account... Not the best modularity but whatevs
function sendNewMeetingEmail(inviterEmail, inviteeEmail, title) {
  var subject = inviterEmail + " wants to meet with you! Login to Meetable to schedule it now!";
  var text = inviterEmail + " wants to meet with you for a meeting \"" + title + "\"\n" +
            "Login to schedule it now! https://www.meetable.us\n\n\n" +
            "You are receiving this email because " + inviterEmail + " tried to invite you to Meetable.";
  Meteor.call("sendEmail", inviteeEmail, inviterEmail, subject, text);
}