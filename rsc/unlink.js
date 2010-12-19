(function() {
var data = {
    profile: null,
    positions: null,
    educations: null,
    recommendations: null,
    connections: null,
    shares: null
},
PROGRESS_WIDTH = 208,
PROFILE_URL = "/people/~:(first-name,last-name,headline,location:(name,country:(code)),industry,current-status,current-status-timestamp,current-share,num-connections,summary,specialties,proposal-comments,associations,honors,interests,num-recommenders,phone-numbers,im-accounts,twitter-accounts,date-of-birth,main-address,member-url-resources)",
POSITIONS_URL = "/people/~/positions:(id,title,summary,start-date,end-date,is-current,company:(name,type,size,industry,ticker))",
EDUCATIONS_URL = "/people/~/educations:(id,school-name,field-of-study,start-date,end-date,degree,activities,notes)",
RECOMMENDATION_URL = "/people/~/recommendations-received:(id,recommendation-type,recommender:(first-name,last-name))",
CONNECTIONS_URL = "/people/~/connections:(first-name,last-name,phone-numbers,im-accounts,twitter-accounts,date-of-birth,main-address,member-url-resources)",
SHARES_URL = "/people/~/network";

// Go make a ton of API calls (raw style) to get all your personal data
window.onAuth = function() {
    $("#progress-area").removeClass("step-1").addClass("step-2");
    
    IN.API.Raw(PROFILE_URL).result(function(r) {
        logResult("profile", r);
    })
    .error(function(r) {
        logError("profile");
    });
    
    IN.API.Raw(POSITIONS_URL).result(function(r) {
        logResult("positions", r);
    })
    .error(function(r) {
        logError("positions");
    });
    
    IN.API.Raw(EDUCATIONS_URL).result(function(r) {
        logResult("educations", r);
    })
    .error(function(r) {
        logError("educations");
    });
    
    IN.API.Raw(RECOMMENDATION_URL).result(function(r) {
        logResult("recommendations", r);
    })
    .error(function(r) {
        logError("recommendations");
    });
    
    IN.API.Raw(CONNECTIONS_URL).result(function(r) {
        logResult("connections", r);
    })
    .error(function(r) {
        logError("connections");
    });
    
    IN.API.Raw(SHARES_URL).params({
      type:"SHAR",
      scope: "self"
    })
    .result(function(r) {
        logResult("shares", r);
    })
    .error(function(r) {
        logError("shares");
    });
    
};

function logResult(name, result) {
    IN.API.toRS(result).$object(function(json) {
      data[name] = json;
      updateState();
    }).destroy();
}

function logError(name, result) {
    data[name] = false;
    updateState();
}

function assemblePayload() {
    var out = {};
    out.profile = data.profile;
    out.profile.recommendations = data.recommendations;
    out.profile.positions = data.positions;
    out.profile.educations = data.educations;
    out.profile.connections = data.connections;
    out.shares = data.shares;
    return JSON.stringify(out);
}

function updateState() {
    var size = 0;
    var total = 0;
    var setWidth = 0;
    for (name in data) {
        total++;
        if (data[name]) {
            size++;
        }
    }
    
    setWidth = 208 - Math.ceil((size / total) * PROGRESS_WIDTH);
    $("#progress-mask").animate({
      width: setWidth + "px"
    }, 300, "linear", function() {
      if (size === total) {
          $("#progress-area").removeClass("step-2").addClass("step-3");
          // TODO FIXME $("#your-data").value(assemblePayload());
      }
    });
}

})();