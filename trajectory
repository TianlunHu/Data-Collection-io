import numpy as np
import matplotlib.pyplot as plt
import string
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm


def quaternion_rotation(p, q):
    def quaternion_multiply(quaternion1, quaternion0):
        x0, y0, z0, w0 = quaternion0
        x1, y1, z1, w1 = quaternion1
        return np.array([x1 * w0 + y1 * z0 - z1 * y0 + w1 * x0,
                         -x1 * z0 + y1 * w0 + z1 * x0 + w1 * y0,
                         x1 * y0 - y1 * x0 + z1 * w0 + w1 * z0,
                         -x1 * x0 - y1 * y0 - z1 * z0 + w1 * w0])

    def quaternion_inverse(quaternion):
        x0, y0, z0, w0 = quaternion
        return np.array([-x0, -y0, -z0, w0])

    q_p = quaternion_multiply(q, p)
    q_inv = quaternion_inverse(q)

    return quaternion_multiply(q_p, q_inv)


# ---------------- Load Data Sources --------------- #
Source_version = '10.0'
timeSource = 'TimeStamp' + Source_version + '.txt'
quaterSource = 'orientation' + Source_version + '.txt'
accSource = 'Acceleration' + Source_version + '.txt'

timeData = np.loadtxt(timeSource)
quaterData = np.loadtxt(quaterSource)
accData = np.loadtxt(accSource)

N = min(int(timeData.shape[0]), int(quaterData.shape[0]/4), int(accData.shape[0]/3))
Freq = np.round(N/(timeData[-1] - timeData[0]))
print(N)
print(Freq)

quaterData = quaterData[:4*N].reshape((N, 4))
accData = accData[:3*N].reshape((N, 3))

# --------------- Uniform Motion Detection ------------ #
acc_dif = np.zeros([N, 3])
acc_dif[:-1, :] = accData[1:]-accData[:-1]
acc_dif_norm = (acc_dif**2).sum(axis=1)**0.5

thr = 0.03  # for acc < thread, we assume that the phone is not moving
Half_Freq = int(Freq/2)
starts = []
ends = []
observe = Half_Freq*2
# check for every 45 readings to see whether the object is doing uniform motion (ACC = 0)
for i in range(N):
    # if no 'start' of this stable state is given, get 'start' first
    if len(starts) == len(ends):
        # if in 45 readings there is no ACC
        if (acc_dif_norm[i:i+observe] > thr).sum() == 0:
            starts.append(i)
    else:
        # check the end of this segment of uniform motion
        if (acc_dif_norm[i:i+observe] > thr).sum() != 0:
            ends.append(i)

true_starts = [0]
true_ends = []
for count in range(len(ends)):
    # check if the index of next 'start' is bigger enough as last 'end'
    if starts[count + 1] - ends[count] > Half_Freq:
        true_starts.append(starts[count + 1])
        true_ends.append(ends[count])
true_ends.append(N-1)

# print all 'starts' and 'ends' of intervals that regarded as uniform motion
print('true_starts', true_starts)
print('true_ends', true_ends)

# ----------------- Acc Calibration ---------------- #
for j in range(len(true_starts)):
    accData[true_starts[j]:true_ends[j], :] = 0  # Assume that in this time interval object is stability
    if j != 0:
        accData[true_ends[j-1]:true_starts[j], :] = \
            accData[true_ends[j-1]:true_starts[j], :] - \
            np.mean(accData[true_ends[j-1]:true_starts[j], :], axis=0)

# ------------------ Data Preparation -------------- #
accData = np.concatenate((np.zeros((N, 1)), accData), axis=1)
new_accData = np.zeros((N, 4))

# ----------------- Orientation Vec ---------------- #
oriData = np.zeros((N, 3))
Q_x = quaterData[:, 0]
Q_y = quaterData[:, 1]
Q_z = quaterData[:, 2]
Q_w = quaterData[:, 3]
# Vector od X direction
oriData[:, 0] = 1 - 2*Q_y**2 - 2*Q_z**2
oriData[:, 1] = 2*(Q_x*Q_y + Q_z*Q_w)
oriData[:, 2] = 2*(Q_x*Q_z - Q_y*Q_w)
# Vector of Y direction
# oriData[:, 0] = 2*(Q_x*Q_y - Q_z*Q_w)
# oriData[:, 1] = 1 - 2*Q_x**2 - 2*Q_z**2
# oriData[:, 2] = 2*(Q_y*Q_z + Q_x*Q_w)
# Vector of Z direction
# oriData[:, 0] = 2*(Q_x*Q_z + Q_y*Q_w)
# oriData[:, 1] = 2*(Q_y*Q_z - Q_x*Q_w)
# oriData[:, 2] = 1 - 2*Q_x**2 - 2*Q_y**2

for i in range(N):
    if i % (Half_Freq) == 0:
        oriData[i] = oriData[i]
    else:
        oriData[i] = np.array([0, 0, 0])

# ----------------- Acc in 3 Direction ------------- #
for i in range(N):
    new_accData[i] = quaternion_rotation(accData[i], quaterData[i])

new_accData = new_accData[:, 1:]

# --------------- Vel in 3 Direction --------------- #
velData = np.cumsum(new_accData, axis=0) / Freq
posData = np.cumsum(velData, axis=0) / Freq

# ---------------------- Plot ---------------------- #
lim = (-2, 2)

t = np.array(range(N))
x = new_accData[:, 0]
y = new_accData[:, 1]
z = new_accData[:, 2]

u = oriData[:, 0]
v = oriData[:, 1]
w = oriData[:, 2]

fig = plt.figure(1)
ax1 = plt.subplot(331)
ax2 = plt.subplot(332)
ax3 = plt.subplot(333)

plt.sca(ax1)
plt.plot(t, x, c='blue')
plt.title('Acc in X direction')
plt.ylabel('a(m/s^2)')
plt.ylim(lim)

plt.sca(ax2)
plt.plot(t, y, c='red')
plt.title('Acc in Y direction')
plt.ylim(lim)

plt.sca(ax3)
plt.plot(t, z, c='green')
plt.title('Acc in Z direction')
plt.ylim(lim)

x = velData[:, 0]
y = velData[:, 1]
z = velData[:, 2]

ax4 = plt.subplot(334)
ax5 = plt.subplot(335)
ax6 = plt.subplot(336)

plt.sca(ax4)
plt.plot(t, x, c='blue')
plt.title('Vel in X direction')
plt.ylabel('v(m/s)')
plt.ylim(lim)

plt.sca(ax5)
plt.plot(t, y, c='red')
plt.title('Vel in Y direction')
plt.ylim(lim)

plt.sca(ax6)
plt.plot(t, z, c='green')
plt.title('Vel in Z direction')
plt.ylim(lim)

x = posData[:, 0]
y = posData[:, 1]
z = posData[:, 2]

ax7 = plt.subplot(337)
ax8 = plt.subplot(338)
ax9 = plt.subplot(339)

plt.sca(ax7)
plt.plot(t, x, c='blue')
plt.title('Trajectory in X direction')
plt.xlabel('time')
plt.ylabel('s(m)')
plt.ylim(lim)

plt.sca(ax8)
plt.plot(t, y, c='red')
plt.title('Trajectory in Y direction')
plt.xlabel('time')
plt.ylim(lim)

plt.sca(ax9)
plt.plot(t, z, c='green')
plt.title('Trajectory in Z direction')
plt.xlabel('time')
plt.ylim(lim)

# ------------------------------- Trajectory in 3 Direction ------------------------ #
fig2 = plt.figure(2)
ax = plt.gca(projection='3d')

ax.quiver(x, y, z, u, v, w, length=0.2, normalize=True, color='blue')
ax.plot(x, y, z, 'r:', linewidth=3)
ax.set_zlabel('Z', fontdict={'size': 15, 'color': 'red'})
ax.set_ylabel('Y', fontdict={'size': 15, 'color': 'red'})
ax.set_xlabel('X', fontdict={'size': 15, 'color': 'red'})
ax.set_xlim(lim)
ax.set_ylim(lim)
ax.set_zlim(lim)
label1 = 'start'
label2 = 'end'
ax.text(x[0], y[0], z[0], label1)
ax.text(x[-1], y[-1], z[-1], label2)

plt.show()

