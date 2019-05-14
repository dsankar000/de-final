import { ApolloServer,
        gql,
        ForbiddenError,
        AuthenticationError } from "apollo-server";
import db from "../models";

// TODO: make async
const makeResolver = (resolver, options) => {
  return (root, args, context, info) => {
    const o = {
      requireUser: true,
      roles: ["Admin", "Student", "Faculty"],
      ...options
    }
    const { requireUser } = o;
    const { roles } = o;
    let user = null;
    let sessionID = null;
/*
    if ( requireUser ) {
      const token = context.req.headers.authorization || "";
      if (!token) throw new AuthenticationError("Token required!");

      [user, sessionID] = getUserForToken(token);
      if (!user) throw new AuthenticationError("Invalid Token/User");

      const userRole = user.role;
      if (_.indexOf(roles, userRole) === -1) {
        throw new ForbiddenError("Operation not permitted for role: " + userRole);
      }
    }
*/
    return resolver(
        root,
        args,
        // {...context, user: user, sessionID: sessionID, db: db},
        {...context, db: db},
        info
    );
  };
};

export default {
    // TODO: ensure permissions are appropriate
    User: {
      __resolveType: (user, context, info) => user.role
    },
    Query: {
      currentUser: makeResolver( (root, args, context, { db }, info) => context.user),
      users: makeResolver((root, args, context, { db }, info) => {
        db.User.findAll()
      }),
      students: makeResolver((root, args, context, { db }, info) => {
        db.User.findAll({
          where: {role: "Student"}
        })
      }),
      faculty: makeResolver((root, args, context, { db }, info) => {
        db.User.findAll({
          where: {role: "Professor"}
        })
      }),
      courses: makeResolver((root, args, context, { db }, info) => {
        db.Course.findAll()
      })
    },
    Mutation: {
      loginUser: makeResolver(
        (root, args, context, info) => {
          return users.login(args.email, args.password);
        },
        {requireUser: false}
      ),
      logoutUser: makeResolver(
        (root, args, context, info) => {
          const sessionID = context.sessionID;
          userSessions.invalidateSession(sessionID);
          return true;
        }
      ),
      createUser: (root, { first, last, email, role }, { db }, context) => {
        db.User.create({
          firstName: first,
          lastName: last,
          email: email,
          role: role
        })
      },
      updateUser: (root, { id }, { first, last, email, role }, { db }, context) => {
        db.User.update({
          firstName: first,
          lastName: last,
          email: email,
          role: role
        },{
          where: {id: id}
        })
      },
      createCourse: (root, { courseName, professorID }, { db }, context) => {
        db.Course.create({
          courseName: courseName,
          professorID: professorID
        })
      },
      deleteCourse: (root, { id }, context) => {
        db.Course.destroy({
          where: {id: id}
        })
      },
      addStudentToCourse: (roots, { courseID, userID }, { db }, context) => {
        // StudentCourse table
        db.StudentCourse.findOrCreate({
          where: {
            courseID: courseID,
            userID: userID
          }
        })
      },
      removeStudentFromCourse: (roots, { courseID, userID }, { db }, context) => {
        // StudentCourse table
        db.StudentCourse.destroy({
          where: {
            courseID: courseID,
            userID: userID
          }
        })
      },
      createAssignment: (roots, {assignmentName, courseID}, context) => {
        db.Assignment.create({
          assignmentName: assignmentName,
          courseID: courseID
        })
      },
      createAssignmentGrade: (roots, { assignmentID, studentID, courseID, grade }, { db }, context) => {
        // AssignmentGrade table
        db.StudentAssignment.update({
          name: name,
          assignmentID: assignmentID,
          studentID: studentID,
          courseID: courseID,
          grade: grade
        })
      }
    }
};