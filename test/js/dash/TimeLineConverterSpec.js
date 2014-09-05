describe("TimelineConverter", function () {
    var helper = window.Helpers.getSpecHelper(),
        objHelper = window.Helpers.getObjectsHelper(),
        timelineConverter = objHelper.getTimelineConverter(),
        liveEdgeFinder = objHelper.getLiveEdgeFinder(),
        testActualLiveEdge = 100,
        testType = "video",
        representation = window.Helpers.getVOHelper().getDummyRepresentation(testType),
        onLiveEdgeFoundEventName = liveEdgeFinder.eventList.ENAME_LIVE_EDGE_FOUND;

        liveEdgeFinder.streamProcessor.getCurrentRepresentation = function() {
            return representation;
        };

    it("should have a handler for LiveEdgeFinder.onLiveEdgeFound event", function () {
        expect(typeof(timelineConverter[onLiveEdgeFoundEventName])).toBe("function");
    });

    it("should calculate timestamp offset", function () {
        var expectedValue = -10;

        expect(timelineConverter.calcMSETimeOffset(representation)).toEqual(expectedValue);
    });

    it("should calculate presentation time from media time", function () {
        var expectedValue = 0,
            mediaTime = 10;

        expect(timelineConverter.calcPresentationTimeFromMediaTime(mediaTime, representation)).toEqual(expectedValue);
    });

    it("should calculate media time from representation time", function () {
        var expectedValue = 10,
            representationTime = 0;

        expect(timelineConverter.calcMediaTimeFromPresentationTime(representationTime, representation)).toEqual(expectedValue);
    });

    it("should calculate presentation start time", function () {
        //representation.adaptation.period.start = 10;
        //representation.adaptation.period.mpd.manifest.type = "static";
        var expectedValue = representation.adaptation.period.start;

        expect(timelineConverter.calcPresentationStartTime(representation.adaptation.period)).toEqual(expectedValue);
        representation.adaptation.period.mpd.manifest.type = "dynamic";
        //representation.adaptation.period.liveEdge = 50;
        expectedValue = representation.adaptation.period.liveEdge;
        expect(timelineConverter.calcPresentationStartTime(representation.adaptation.period)).toEqual(expectedValue);

    });

    it("should calculate presentation time from wall-clock time", function () {
        //representation.adaptation.period.start = 10;
        //representation.adaptation.period.mpd.manifest.type = "static";
        var expectedValue = 10,
            wallClock = new Date(helper.getUnixTime().getTime() + expectedValue * 1000);
        expect(timelineConverter.calcPresentationTimeFromWallTime(wallClock, representation.adaptation.period)).toEqual(expectedValue);
    });

    it("should calculate availability window for static mpd", function () {
        //representation.adaptation.period.start = 0;
        //representation.adaptation.period.duration = 100;
        //representation.adaptation.period.mpd.manifest.type = "static";
        var expectedValue = representation.adaptation.period.start,
            isDynamic = false,
            range = timelineConverter.calcSegmentAvailabilityRange(representation, isDynamic);

        expect(range.start).toEqual(expectedValue);
        expectedValue = 100;
        expect(range.end).toEqual(expectedValue);
    });

    describe("when the live edge is found", function () {
        var updateCompleted,
            eventDelay = helper.getExecutionDelay(),
            timeoutDelay = helper.getTimeoutDelay();

        beforeEach(function () {
            updateCompleted = false;

            setTimeout(function(){
                timelineConverter[onLiveEdgeFoundEventName](liveEdgeFinder, testActualLiveEdge);
                updateCompleted = true;
            }, eventDelay);
        });

        it("should set isClientServerTimeSyncCompleted flag for Period", function () {
            waitsFor(function (/*argument*/) {
                return updateCompleted;
            }, 'Timeout', timeoutDelay);

            runs(function() {
                expect(representation.adaptation.period.mpd.isClientServerTimeSyncCompleted).toBeTruthy();
            });
        });

        it("should calculate availability window for dynamic mpd", function () {
            //representation.adaptation.period.start = 0;
            //representation.adaptation.period.duration = 100;
            //representation.adaptation.period.mpd.manifest.type = "static";
            representation.adaptation.period.mpd.availabilityStartTime = new Date(new Date().getTime() - representation.adaptation.period.mpd.timeShiftBufferDepth * 1000);

            var expectedValue = 0,
                isDynamic = true,
                range = timelineConverter.calcSegmentAvailabilityRange(representation, isDynamic);

            expect(range.start).toEqual(expectedValue);
            expectedValue = 10;
            expect(range.end).toEqual(expectedValue);
        });
    });
});